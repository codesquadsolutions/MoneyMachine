/**
 * Copy Firestore → Postgres (safe to re-run). Does NOT delete Firestore data.
 *
 * Migrates: waitlist, crmLeads (+ activities), crmCampaigns, affiliateLeads
 *
 * Auth options (first that works):
 *  1) FIREBASE_SERVICE_ACCOUNT_JSON / GOOGLE_APPLICATION_CREDENTIALS (Admin SDK)
 *  2) Client login as admin@flipur.trade using FIREBASE_ADMIN_EMAIL + FIREBASE_ADMIN_PASSWORD
 *     (or VITE_ADMIN_PASSWORD / ADMIN_PASSWORD) + web config from apps/admin/.env
 *
 * Usage:
 *   npm run migrate:firestore
 *   npm run migrate:firestore -- --dump-only   # write .local/firestore-export.json only
 *   npm run migrate:firestore -- --from-json ../.local/firestore-export.json
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp as initAdminApp, cert, getApps } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { initializeApp as initClientApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, getFirestore as getClientFirestore } from "firebase/firestore";
import { migrate, query, newId } from "../src/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const dumpDefault = path.join(repoRoot, ".local", "firestore-export.json");

function parseArgs(argv) {
  const args = { dumpOnly: false, fromJson: "", skipPg: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--dump-only") args.dumpOnly = true;
    if (argv[i] === "--from-json") args.fromJson = argv[++i] || "";
    if (argv[i] === "--skip-pg") args.skipPg = true;
  }
  return args;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    out[trimmed.slice(0, i)] = trimmed.slice(i + 1);
  }
  return out;
}

function asDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?._seconds === "number") return new Date(value._seconds * 1000);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function inferSource(data = {}) {
  if (data.source) return String(data.source);
  const src = String(data.utmSource || "").toLowerCase();
  const med = String(data.utmMedium || "").toLowerCase();
  if (src.includes("instagram") || src === "ig") return "instagram";
  if (src.includes("facebook") || src.includes("meta") || src === "fb" || data.fbclid) return "meta";
  if (src || med) return "meta";
  return "website";
}

function serializeDoc(id, data) {
  const out = { id, ...data };
  for (const [k, v] of Object.entries(out)) {
    if (v && typeof v.toDate === "function") out[k] = v.toDate().toISOString();
    else if (v && typeof v._seconds === "number") out[k] = new Date(v._seconds * 1000).toISOString();
  }
  return out;
}

function loadCredential() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) return cert(JSON.parse(inline));
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (credPath && fs.existsSync(credPath)) return cert(JSON.parse(fs.readFileSync(credPath, "utf8")));
  return undefined;
}

async function readViaAdminSdk() {
  const credential = loadCredential();
  if (!credential) return null;
  if (!getApps().length) {
    initAdminApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "money-machine-247",
    });
  }
  const db = getAdminFirestore();
  console.log("[migrate] reading Firestore via Admin SDK…");
  return readAllCollections(async (name) => {
    const snap = await db.collection(name).get();
    return snap.docs.map((d) => serializeDoc(d.id, d.data() || {}));
  }, async (leadId) => {
    const snap = await db.collection("crmLeads").doc(leadId).collection("activities").get();
    return snap.docs.map((d) => serializeDoc(d.id, d.data() || {}));
  });
}

async function readViaClientAdminLogin() {
  const adminEnv = {
    ...loadEnvFile(path.join(repoRoot, "apps/admin/.env")),
    ...loadEnvFile(path.join(repoRoot, "apps/admin/.env.local")),
    ...loadEnvFile(path.join(repoRoot, "apps/admin/.env.production")),
    ...process.env,
  };
  const apiKey = adminEnv.VITE_FIREBASE_API_KEY;
  const projectId = adminEnv.VITE_FIREBASE_PROJECT_ID || "money-machine-247";
  const authDomain = adminEnv.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`;
  const email = adminEnv.FIREBASE_ADMIN_EMAIL || "admin@flipur.trade";
  const password =
    adminEnv.FIREBASE_ADMIN_PASSWORD || adminEnv.VITE_ADMIN_PASSWORD || adminEnv.ADMIN_PASSWORD || "";
  if (!apiKey || !password) {
    console.log("[migrate] client login skipped (need VITE_FIREBASE_API_KEY + admin password).");
    return null;
  }

  console.log(`[migrate] signing into Firestore as ${email}…`);
  const app = initClientApp({ apiKey, authDomain, projectId });
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, email, password);
  const db = getClientFirestore(app);

  return readAllCollections(async (name) => {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((d) => serializeDoc(d.id, d.data() || {}));
  }, async (leadId) => {
    const snap = await getDocs(collection(db, "crmLeads", leadId, "activities"));
    return snap.docs.map((d) => serializeDoc(d.id, d.data() || {}));
  });
}

async function readAllCollections(listCollection, listActivities) {
  const waitlist = await listCollection("waitlist").catch((err) => {
    console.warn("[migrate] waitlist read failed:", err.message);
    return [];
  });
  const crmLeads = await listCollection("crmLeads").catch(() => []);
  const crmCampaigns = await listCollection("crmCampaigns").catch(() => []);
  const affiliateLeads = await listCollection("affiliateLeads").catch(() => []);

  const activitiesByLead = {};
  for (const lead of crmLeads) {
    activitiesByLead[lead.id] = await listActivities(lead.id).catch(() => []);
  }

  return { waitlist, crmLeads, crmCampaigns, affiliateLeads, activitiesByLead };
}

async function upsertWaitlistRow(data) {
  const email = String(data.email || "").trim().toLowerCase();
  if (!email) return { skipped: true };
  const existing = await query(`SELECT id FROM waitlist WHERE LOWER(email) = $1 LIMIT 1`, [email]);
  const id = existing.rows[0]?.id || data.id || newId();
  const createdAt = asDate(data.createdAt) || new Date();
  const status = data.status === "invited" ? "invited" : "waiting";

  await query(
    `INSERT INTO waitlist (
      id, email, display_name, photo_url, phone, platform, status, source,
      utm_source, utm_medium, utm_campaign, fbclid, firebase_uid, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = COALESCE(NULLIF(EXCLUDED.display_name, ''), waitlist.display_name),
      photo_url = COALESCE(NULLIF(EXCLUDED.photo_url, ''), waitlist.photo_url),
      phone = COALESCE(NULLIF(EXCLUDED.phone, ''), waitlist.phone),
      platform = COALESCE(NULLIF(EXCLUDED.platform, ''), waitlist.platform),
      status = EXCLUDED.status,
      source = COALESCE(NULLIF(EXCLUDED.source, ''), waitlist.source),
      utm_source = COALESCE(NULLIF(EXCLUDED.utm_source, ''), waitlist.utm_source),
      utm_medium = COALESCE(NULLIF(EXCLUDED.utm_medium, ''), waitlist.utm_medium),
      utm_campaign = COALESCE(NULLIF(EXCLUDED.utm_campaign, ''), waitlist.utm_campaign),
      fbclid = COALESCE(NULLIF(EXCLUDED.fbclid, ''), waitlist.fbclid),
      firebase_uid = COALESCE(NULLIF(EXCLUDED.firebase_uid, ''), waitlist.firebase_uid),
      updated_at = NOW()`,
    [
      id,
      email,
      String(data.displayName || data.name || "").trim(),
      String(data.photoURL || "").trim(),
      String(data.phone || "").trim(),
      String(data.platform || "").trim(),
      status,
      inferSource(data),
      String(data.utmSource || "").trim(),
      String(data.utmMedium || "").trim(),
      String(data.utmCampaign || "").trim(),
      String(data.fbclid || "").trim(),
      String(data.firebaseUid || data.id || "").trim(),
      createdAt,
    ],
  );

  await query(
    `INSERT INTO crm_leads (
      id, name, email, phone, source, type, stage,
      utm_source, utm_medium, utm_campaign, fbclid,
      waitlist_id, platform, first_touch_at, last_touch_at, stage_updated_at, created_at, updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,'customer',$6,$7,$8,$9,$10,$11,$12,$13,$13,$13,$13,$13
    )
    ON CONFLICT (id) DO UPDATE SET
      name = COALESCE(NULLIF(EXCLUDED.name, ''), crm_leads.name),
      email = EXCLUDED.email,
      waitlist_id = EXCLUDED.waitlist_id,
      platform = COALESCE(NULLIF(EXCLUDED.platform, ''), crm_leads.platform),
      stage = CASE WHEN EXCLUDED.stage = 'invited' THEN 'invited' ELSE crm_leads.stage END,
      last_touch_at = GREATEST(crm_leads.last_touch_at, EXCLUDED.last_touch_at),
      updated_at = NOW()`,
    [
      id,
      String(data.displayName || data.name || "").trim(),
      email,
      String(data.phone || "").trim(),
      inferSource(data),
      status === "invited" ? "invited" : "new",
      String(data.utmSource || "").trim(),
      String(data.utmMedium || "").trim(),
      String(data.utmCampaign || "").trim(),
      String(data.fbclid || "").trim(),
      id,
      String(data.platform || "").trim(),
      createdAt,
    ],
  );

  return { id, email };
}

async function importBundle(bundle) {
  let waitlistOk = 0;
  for (const row of bundle.waitlist || []) {
    const result = await upsertWaitlistRow(row);
    if (!result.skipped) waitlistOk += 1;
  }

  let crmOk = 0;
  for (const data of bundle.crmLeads || []) {
    const email = String(data.email || "").trim().toLowerCase();
    const phone = String(data.phone || "").trim();
    if (!email && !phone) continue;
    const createdAt = asDate(data.createdAt) || asDate(data.firstTouchAt) || new Date();
    await query(
      `INSERT INTO crm_leads (
        id, name, email, phone, source, type, stage,
        utm_source, utm_medium, utm_campaign, fbclid,
        call_status, last_call_at, preferred_language,
        waitlist_id, affiliate_lead_id, affiliate_id, chat_session_id,
        platform, note, first_touch_at, last_touch_at, stage_updated_at, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$21,$21
      )
      ON CONFLICT (id) DO UPDATE SET
        name = COALESCE(NULLIF(EXCLUDED.name, ''), crm_leads.name),
        email = COALESCE(NULLIF(EXCLUDED.email, ''), crm_leads.email),
        phone = COALESCE(NULLIF(EXCLUDED.phone, ''), crm_leads.phone),
        stage = EXCLUDED.stage,
        note = COALESCE(NULLIF(EXCLUDED.note, ''), crm_leads.note),
        updated_at = NOW()`,
      [
        data.id,
        String(data.name || "").trim(),
        email,
        phone,
        String(data.source || "website"),
        String(data.type || "customer"),
        String(data.stage || "new"),
        String(data.utmSource || ""),
        String(data.utmMedium || ""),
        String(data.utmCampaign || ""),
        String(data.fbclid || ""),
        String(data.callStatus || "none"),
        asDate(data.lastCallAt),
        String(data.preferredLanguage || ""),
        String(data.waitlistId || ""),
        String(data.affiliateLeadId || ""),
        String(data.affiliateId || ""),
        String(data.chatSessionId || ""),
        String(data.platform || ""),
        String(data.note || ""),
        createdAt,
        asDate(data.lastTouchAt) || createdAt,
        asDate(data.stageUpdatedAt) || createdAt,
      ],
    );
    const acts = bundle.activitiesByLead?.[data.id] || [];
    for (const a of acts) {
      const exists = await query(`SELECT id FROM crm_activities WHERE id = $1`, [a.id]);
      if (exists.rows[0]) continue;
      await query(
        `INSERT INTO crm_activities (id, lead_id, type, text, meta_json, created_at)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6)`,
        [a.id, data.id, a.type || "note", a.text || "", JSON.stringify(a.meta || {}), asDate(a.at) || new Date()],
      );
    }
    crmOk += 1;
  }

  let campaignsOk = 0;
  for (const data of bundle.crmCampaigns || []) {
    await query(
      `INSERT INTO crm_campaigns (id, name, channel, utm_source, utm_medium, utm_campaign, notes, active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
      [
        data.id,
        String(data.name || "Campaign"),
        String(data.channel || "meta"),
        String(data.utmSource || ""),
        String(data.utmMedium || ""),
        String(data.utmCampaign || ""),
        String(data.notes || ""),
        data.active !== false,
        asDate(data.createdAt) || new Date(),
      ],
    );
    campaignsOk += 1;
  }

  let affOk = 0;
  for (const data of bundle.affiliateLeads || []) {
    const email = String(data.email || "").trim().toLowerCase();
    if (!email) continue;
    await query(
      `INSERT INTO affiliate_leads (
        id, display_name, email, instagram, youtube, snapchat, linkedin, discord, telegram, website, note, status, admin_note, affiliate_id, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        email = EXCLUDED.email,
        status = EXCLUDED.status,
        updated_at = NOW()`,
      [
        data.id,
        String(data.displayName || data.name || "").trim() || email,
        email,
        String(data.instagram || ""),
        String(data.youtube || ""),
        String(data.snapchat || ""),
        String(data.linkedin || ""),
        String(data.discord || ""),
        String(data.telegram || ""),
        String(data.website || ""),
        String(data.note || ""),
        String(data.status || "new"),
        String(data.adminNote || ""),
        data.affiliateId || null,
        asDate(data.createdAt) || new Date(),
      ],
    );
    affOk += 1;
  }

  return { waitlistOk, crmOk, campaignsOk, affOk };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let bundle;

  if (args.fromJson) {
    const file = path.resolve(args.fromJson);
    bundle = JSON.parse(fs.readFileSync(file, "utf8"));
    console.log(`[migrate] loaded dump ${file}`);
  } else {
    bundle = (await readViaAdminSdk()) || (await readViaClientAdminLogin());
    if (!bundle) {
      throw new Error(
        "Could not read Firestore. Add a service account to api/.env, or ensure apps/admin/.env has VITE_FIREBASE_API_KEY and VITE_ADMIN_PASSWORD for admin@flipur.trade.",
      );
    }
    fs.mkdirSync(path.dirname(dumpDefault), { recursive: true });
    fs.writeFileSync(dumpDefault, JSON.stringify(bundle, null, 2));
    console.log(`[migrate] wrote safety dump ${dumpDefault}`);
    console.log("[migrate] counts:", {
      waitlist: bundle.waitlist?.length || 0,
      crmLeads: bundle.crmLeads?.length || 0,
      crmCampaigns: bundle.crmCampaigns?.length || 0,
      affiliateLeads: bundle.affiliateLeads?.length || 0,
    });
  }

  if (args.dumpOnly || args.skipPg) {
    console.log("[migrate] dump-only complete (Postgres import skipped).");
    return;
  }

  console.log("[migrate] ensuring Postgres tables…");
  await migrate();
  const imported = await importBundle(bundle);
  console.log("[migrate] imported:", imported);

  const counts = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM waitlist) AS waitlist,
      (SELECT COUNT(*)::int FROM crm_leads) AS crm_leads,
      (SELECT COUNT(*)::int FROM crm_campaigns) AS crm_campaigns,
      (SELECT COUNT(*)::int FROM affiliate_leads) AS affiliate_leads
  `);
  console.log("[migrate] postgres counts:", counts.rows[0]);
  console.log("[migrate] done. Firestore left untouched.");
}

main().catch((err) => {
  console.error("[migrate] failed:", err.message || err);
  process.exit(1);
});
