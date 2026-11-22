import { query, newId } from "../db.js";
import { requireAdmin, verifyAdminPassword, signAdminToken, adminUser } from "../authTokens.js";

function iso(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function inferSource({ utmSource, utmMedium, source, fbclid } = {}) {
  if (source) return String(source);
  const src = String(utmSource || "").toLowerCase();
  const med = String(utmMedium || "").toLowerCase();
  if (src.includes("instagram") || src === "ig" || med.includes("instagram")) return "instagram";
  if (src.includes("facebook") || src.includes("meta") || src === "fb" || fbclid || med === "paid_social") return "meta";
  if (src.includes("chat") || med.includes("chat")) return "chat";
  if (utmSource || utmMedium) return "meta";
  return "website";
}

function mapLead(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || "",
    email: row.email || "",
    phone: row.phone || "",
    source: row.source || "website",
    type: row.type || "customer",
    stage: row.stage || "new",
    utmSource: row.utm_source || "",
    utmMedium: row.utm_medium || "",
    utmCampaign: row.utm_campaign || "",
    fbclid: row.fbclid || "",
    callStatus: row.call_status || "none",
    lastCallAt: iso(row.last_call_at),
    preferredLanguage: row.preferred_language || "",
    waitlistId: row.waitlist_id || "",
    affiliateLeadId: row.affiliate_lead_id || "",
    affiliateId: row.affiliate_id || "",
    chatSessionId: row.chat_session_id || "",
    platform: row.platform || "",
    note: row.note || "",
    firstTouchAt: iso(row.first_touch_at),
    lastTouchAt: iso(row.last_touch_at),
    stageUpdatedAt: iso(row.stage_updated_at),
    nextActionAt: iso(row.next_action_at),
    createdAt: iso(row.created_at),
  };
}

function mapWaitlist(row) {
  return {
    id: row.id,
    name: row.display_name || "",
    email: row.email || "",
    phone: row.phone || "",
    photoURL: row.photo_url || "",
    platform: row.platform || "",
    status: row.status === "invited" ? "invited" : "waiting",
    source: row.source || "website",
    utmSource: row.utm_source || "",
    utmMedium: row.utm_medium || "",
    utmCampaign: row.utm_campaign || "",
    fbclid: row.fbclid || "",
    firebaseUid: row.firebase_uid || "",
    createdAt: iso(row.created_at),
  };
}

function mapCampaign(row) {
  return {
    id: row.id,
    name: row.name || "",
    channel: row.channel || "meta",
    utmSource: row.utm_source || "",
    utmMedium: row.utm_medium || "",
    utmCampaign: row.utm_campaign || "",
    notes: row.notes || "",
    active: row.active !== false,
    createdAt: iso(row.created_at),
  };
}

async function addActivity(leadId, { type = "note", text = "", meta = {} } = {}) {
  await query(
    `INSERT INTO crm_activities (id, lead_id, type, text, meta_json) VALUES ($1,$2,$3,$4,$5::jsonb)`,
    [newId(), leadId, type, text, JSON.stringify(meta || {})],
  );
}

async function findLeadRow({ email, phone, id } = {}) {
  if (id) {
    const { rows } = await query(`SELECT * FROM crm_leads WHERE id = $1`, [id]);
    if (rows[0]) return rows[0];
  }
  const em = normalizeEmail(email);
  if (em) {
    const { rows } = await query(`SELECT * FROM crm_leads WHERE LOWER(email) = $1 LIMIT 1`, [em]);
    if (rows[0]) return rows[0];
  }
  const ph = String(phone || "").trim();
  if (ph) {
    const { rows } = await query(`SELECT * FROM crm_leads WHERE phone = $1 LIMIT 1`, [ph]);
    if (rows[0]) return rows[0];
  }
  return null;
}

export async function upsertCrmLead(input = {}, { activityText, activityType = "system" } = {}) {
  const email = normalizeEmail(input.email);
  const phone = String(input.phone || "").trim();
  if (!email && !phone) throw Object.assign(new Error("Email or phone is required."), { status: 400 });

  const existing = await findLeadRow({ email, phone, id: input.id });
  const stage = input.stage || existing?.stage || "new";
  const source = input.source || existing?.source || inferSource(input) || "website";
  const id = existing?.id || input.id || newId();
  const created = !existing;

  await query(
    `INSERT INTO crm_leads (
      id, name, email, phone, source, type, stage,
      utm_source, utm_medium, utm_campaign, fbclid,
      call_status, last_call_at, preferred_language,
      waitlist_id, affiliate_lead_id, affiliate_id, chat_session_id,
      platform, note, first_touch_at, last_touch_at, stage_updated_at, next_action_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,
      $12,$13,$14,
      $15,$16,$17,$18,
      $19,$20,COALESCE($21::timestamptz, NOW()), NOW(),
      CASE WHEN $22::boolean THEN NOW() ELSE COALESCE($23::timestamptz, NOW()) END,
      $24::timestamptz
    )
    ON CONFLICT (id) DO UPDATE SET
      name = COALESCE(NULLIF(EXCLUDED.name, ''), crm_leads.name),
      email = COALESCE(NULLIF(EXCLUDED.email, ''), crm_leads.email),
      phone = COALESCE(NULLIF(EXCLUDED.phone, ''), crm_leads.phone),
      source = CASE
        WHEN crm_leads.source IS NULL OR crm_leads.source = '' OR crm_leads.source = 'website'
        THEN EXCLUDED.source ELSE crm_leads.source END,
      type = COALESCE(NULLIF(EXCLUDED.type, ''), crm_leads.type),
      stage = EXCLUDED.stage,
      utm_source = COALESCE(NULLIF(EXCLUDED.utm_source, ''), crm_leads.utm_source),
      utm_medium = COALESCE(NULLIF(EXCLUDED.utm_medium, ''), crm_leads.utm_medium),
      utm_campaign = COALESCE(NULLIF(EXCLUDED.utm_campaign, ''), crm_leads.utm_campaign),
      fbclid = COALESCE(NULLIF(EXCLUDED.fbclid, ''), crm_leads.fbclid),
      call_status = COALESCE(NULLIF(EXCLUDED.call_status, ''), crm_leads.call_status),
      last_call_at = COALESCE(EXCLUDED.last_call_at, crm_leads.last_call_at),
      preferred_language = COALESCE(NULLIF(EXCLUDED.preferred_language, ''), crm_leads.preferred_language),
      waitlist_id = COALESCE(NULLIF(EXCLUDED.waitlist_id, ''), crm_leads.waitlist_id),
      affiliate_lead_id = COALESCE(NULLIF(EXCLUDED.affiliate_lead_id, ''), crm_leads.affiliate_lead_id),
      affiliate_id = COALESCE(NULLIF(EXCLUDED.affiliate_id, ''), crm_leads.affiliate_id),
      chat_session_id = COALESCE(NULLIF(EXCLUDED.chat_session_id, ''), crm_leads.chat_session_id),
      platform = COALESCE(NULLIF(EXCLUDED.platform, ''), crm_leads.platform),
      note = COALESCE(NULLIF(EXCLUDED.note, ''), crm_leads.note),
      last_touch_at = NOW(),
      stage_updated_at = CASE WHEN EXCLUDED.stage IS DISTINCT FROM crm_leads.stage THEN NOW() ELSE crm_leads.stage_updated_at END,
      next_action_at = COALESCE(EXCLUDED.next_action_at, crm_leads.next_action_at),
      updated_at = NOW()`,
    [
      id,
      String(input.name || existing?.name || "").trim(),
      email || existing?.email || "",
      phone || existing?.phone || "",
      source,
      input.type || existing?.type || "customer",
      stage,
      input.utmSource || existing?.utm_source || "",
      input.utmMedium || existing?.utm_medium || "",
      input.utmCampaign || existing?.utm_campaign || "",
      input.fbclid || existing?.fbclid || "",
      input.callStatus || existing?.call_status || "none",
      input.lastCallAt || existing?.last_call_at || null,
      input.preferredLanguage || existing?.preferred_language || "",
      input.waitlistId || existing?.waitlist_id || "",
      input.affiliateLeadId || existing?.affiliate_lead_id || "",
      input.affiliateId || existing?.affiliate_id || "",
      input.chatSessionId || existing?.chat_session_id || "",
      input.platform || existing?.platform || "",
      input.note || existing?.note || "",
      input.firstTouchAt || existing?.first_touch_at || null,
      !existing || existing.stage !== stage,
      existing?.stage_updated_at || null,
      input.nextActionAt || existing?.next_action_at || null,
    ],
  );

  if (created) {
    await addActivity(id, { type: activityType || "system", text: activityText || "Lead created" });
  } else if (activityText && activityType !== "system") {
    await addActivity(id, { type: activityType, text: activityText });
  }

  const { rows } = await query(`SELECT * FROM crm_leads WHERE id = $1`, [id]);
  return mapLead(rows[0]);
}

async function listLeads() {
  const { rows } = await query(`SELECT * FROM crm_leads ORDER BY last_touch_at DESC NULLS LAST LIMIT 2000`);
  return rows.map(mapLead);
}

async function listCampaigns() {
  const { rows } = await query(`SELECT * FROM crm_campaigns ORDER BY created_at DESC`);
  return rows.map(mapCampaign);
}

async function listWaitlist() {
  const { rows } = await query(`SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 5000`);
  return rows.map(mapWaitlist);
}

async function listActivities(leadId) {
  const { rows } = await query(
    `SELECT * FROM crm_activities WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [leadId],
  );
  return rows.map((row) => ({
    id: row.id,
    type: row.type || "note",
    text: row.text || "",
    meta: row.meta_json || {},
    at: iso(row.created_at),
  }));
}

export async function joinWaitlist(input = {}) {
  const email = normalizeEmail(input.email);
  if (!email) throw Object.assign(new Error("Email is required."), { status: 400 });

  const existing = await query(`SELECT * FROM waitlist WHERE LOWER(email) = $1 LIMIT 1`, [email]);
  const attrSource = inferSource(input);
  let id = existing.rows[0]?.id;

  if (id) {
    await query(
      `UPDATE waitlist SET
        display_name = COALESCE(NULLIF($2, ''), display_name),
        photo_url = COALESCE(NULLIF($3, ''), photo_url),
        phone = COALESCE(NULLIF($4, ''), phone),
        firebase_uid = COALESCE(NULLIF($5, ''), firebase_uid),
        updated_at = NOW()
       WHERE id = $1`,
      [
        id,
        String(input.displayName || input.name || "").trim(),
        String(input.photoURL || "").trim(),
        String(input.phone || "").trim(),
        String(input.firebaseUid || "").trim(),
      ],
    );
  } else {
    id = newId();
    await query(
      `INSERT INTO waitlist (
        id, email, display_name, photo_url, phone, platform, status, source,
        utm_source, utm_medium, utm_campaign, fbclid, firebase_uid
      ) VALUES ($1,$2,$3,$4,$5,$6,'waiting',$7,$8,$9,$10,$11,$12)`,
      [
        id,
        email,
        String(input.displayName || input.name || "").trim(),
        String(input.photoURL || "").trim(),
        String(input.phone || "").trim(),
        String(input.platform || "").trim(),
        attrSource,
        String(input.utmSource || "").trim(),
        String(input.utmMedium || "").trim(),
        String(input.utmCampaign || "").trim(),
        String(input.fbclid || "").trim(),
        String(input.firebaseUid || "").trim(),
      ],
    );
  }

  const person = (await query(`SELECT * FROM waitlist WHERE id = $1`, [id])).rows[0];
  await upsertCrmLead(
    {
      name: person.display_name,
      email: person.email,
      phone: person.phone,
      source: person.source,
      type: "customer",
      stage: person.status === "invited" ? "invited" : "new",
      utmSource: person.utm_source,
      utmMedium: person.utm_medium,
      utmCampaign: person.utm_campaign,
      fbclid: person.fbclid,
      waitlistId: person.id,
      platform: person.platform,
    },
    { activityType: "system", activityText: "Joined waitlist" },
  );

  return mapWaitlist(person);
}

async function syncFromWaitlist() {
  const people = await listWaitlist();
  let count = 0;
  for (const person of people) {
    await upsertCrmLead(
      {
        name: person.name,
        email: person.email,
        phone: person.phone,
        source: person.source || inferSource(person),
        type: "customer",
        stage: person.status === "invited" ? "invited" : undefined,
        utmSource: person.utmSource,
        utmMedium: person.utmMedium,
        utmCampaign: person.utmCampaign,
        fbclid: person.fbclid,
        waitlistId: person.id,
        platform: person.platform,
        firstTouchAt: person.createdAt,
      },
      { activityType: "system" },
    );
    count += 1;
  }
  return count;
}

async function syncFromAffiliateLeads() {
  const { rows } = await query(
    `SELECT * FROM affiliate_leads WHERE status IN ('new','contacted','rejected','onboarded') ORDER BY created_at DESC LIMIT 500`,
  );
  let count = 0;
  for (const row of rows) {
    let stage = "new";
    if (row.status === "contacted") stage = "contacted";
    if (row.status === "onboarded") stage = "converted";
    if (row.status === "rejected") stage = "lost";
    await upsertCrmLead(
      {
        name: row.display_name,
        email: row.email,
        source: "affiliate",
        type: "affiliate_interest",
        stage,
        affiliateLeadId: row.id,
        note: row.note || "",
        firstTouchAt: row.created_at,
      },
      { activityType: "system" },
    );
    count += 1;
  }
  return count;
}

export async function ingestCrmLead(body = {}) {
  const email = normalizeEmail(body.email);
  const phone = String(body.phone || "").trim();
  if (!email && !phone) throw Object.assign(new Error("email or phone required"), { status: 400 });

  const before = await findLeadRow({ email, phone });
  const activityType = body.activityType || (body.chatSessionId ? "chat" : "ad");
  const activityText =
    body.activityText ||
    (body.channel === "meta_lead_ads"
      ? "Ingested from Meta Lead Ads"
      : body.chatSessionId
        ? "Ingested from chatbot"
        : "Ingested via CRM API");

  const lead = await upsertCrmLead(
    {
      name: body.name,
      email,
      phone,
      source: inferSource(body),
      type: body.type || "customer",
      stage: body.stage || before?.stage || "new",
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      fbclid: body.fbclid,
      chatSessionId: body.chatSessionId,
      note: body.note,
    },
    { activityType: "system" },
  );

  if (!before) {
    await addActivity(lead.id, { type: activityType, text: activityText });
  } else {
    await addActivity(lead.id, { type: activityType, text: activityText });
  }
  return lead;
}

export async function handleCrmAdmin(req, res) {
  try {
    const action = String(req.body?.action || "");
    if (action === "login") {
      const username = String(req.body?.username || "");
      const password = String(req.body?.password || "");
      if (!verifyAdminPassword(username, password)) {
        res.status(401).json({ error: "Wrong admin username or password." });
        return;
      }
      res.json({ token: signAdminToken(), user: adminUser });
      return;
    }

    if (!requireAdmin(req)) {
      res.status(401).json({ error: "Admin auth required." });
      return;
    }

    if (action === "leadsList") {
      res.json({ leads: await listLeads() });
      return;
    }
    if (action === "leadUpsert") {
      const lead = await upsertCrmLead(req.body?.lead || req.body || {}, {
        activityText: req.body?.activityText,
        activityType: req.body?.activityType || "system",
      });
      res.json({ lead });
      return;
    }
    if (action === "leadUpdate") {
      const leadId = String(req.body?.leadId || "");
      if (!leadId) {
        res.status(400).json({ error: "leadId required." });
        return;
      }
      const fields = req.body?.fields || {};
      const existing = await findLeadRow({ id: leadId });
      if (!existing) {
        res.status(404).json({ error: "Lead not found." });
        return;
      }
      const lead = await upsertCrmLead(
        {
          id: leadId,
          name: fields.name ?? existing.name,
          email: fields.email ?? existing.email,
          phone: fields.phone ?? existing.phone,
          source: fields.source ?? existing.source,
          type: fields.type ?? existing.type,
          stage: fields.stage ?? existing.stage,
          utmSource: fields.utmSource ?? existing.utm_source,
          utmMedium: fields.utmMedium ?? existing.utm_medium,
          utmCampaign: fields.utmCampaign ?? existing.utm_campaign,
          fbclid: fields.fbclid ?? existing.fbclid,
          callStatus: fields.callStatus ?? existing.call_status,
          lastCallAt: fields.lastCallAt ?? existing.last_call_at,
          preferredLanguage: fields.preferredLanguage ?? existing.preferred_language,
          waitlistId: existing.waitlist_id,
          affiliateLeadId: existing.affiliate_lead_id,
          affiliateId: existing.affiliate_id,
          chatSessionId: fields.chatSessionId ?? existing.chat_session_id,
          platform: fields.platform ?? existing.platform,
          note: fields.note ?? existing.note,
          nextActionAt: fields.nextActionAt ?? existing.next_action_at,
        },
        { activityType: "system" },
      );
      if (req.body?.activity?.text) {
        await addActivity(leadId, {
          type: req.body.activity.type || "note",
          text: req.body.activity.text,
          meta: req.body.activity.meta || {},
        });
      }
      res.json({ lead });
      return;
    }
    if (action === "leadSetStage") {
      const leadId = String(req.body?.leadId || "");
      const stage = String(req.body?.stage || "");
      if (!leadId || !stage) {
        res.status(400).json({ error: "leadId and stage required." });
        return;
      }
      const existing = await findLeadRow({ id: leadId });
      if (!existing) {
        res.status(404).json({ error: "Lead not found." });
        return;
      }
      const lead = await upsertCrmLead(
        { id: leadId, email: existing.email, phone: existing.phone, stage, name: existing.name },
        { activityType: "system" },
      );
      await addActivity(leadId, {
        type: "stage_change",
        text: `Stage moved${req.body?.fromStage ? ` from ${req.body.fromStage}` : ""} to ${stage}`,
        meta: { from: req.body?.fromStage || "", to: stage },
      });
      res.json({ lead });
      return;
    }
    if (action === "leadActivities") {
      const leadId = String(req.body?.leadId || "");
      res.json({ activities: await listActivities(leadId) });
      return;
    }
    if (action === "leadAddNote") {
      const leadId = String(req.body?.leadId || "");
      const text = String(req.body?.text || "").trim();
      if (!leadId || !text) {
        res.status(400).json({ error: "leadId and text required." });
        return;
      }
      await addActivity(leadId, { type: "note", text });
      await query(`UPDATE crm_leads SET last_touch_at = NOW(), updated_at = NOW() WHERE id = $1`, [leadId]);
      res.json({ ok: true, activities: await listActivities(leadId) });
      return;
    }
    if (action === "campaignsList") {
      res.json({ campaigns: await listCampaigns() });
      return;
    }
    if (action === "campaignSave") {
      const fields = req.body?.campaign || req.body || {};
      const name = String(fields.name || "").trim();
      if (!name) {
        res.status(400).json({ error: "Campaign name is required." });
        return;
      }
      const id = fields.id || newId();
      if (fields.id) {
        await query(
          `UPDATE crm_campaigns SET
            name=$2, channel=$3, utm_source=$4, utm_medium=$5, utm_campaign=$6, notes=$7, active=$8, updated_at=NOW()
           WHERE id=$1`,
          [
            id,
            name,
            fields.channel || "meta",
            String(fields.utmSource || "").trim(),
            String(fields.utmMedium || "").trim(),
            String(fields.utmCampaign || "").trim(),
            String(fields.notes || "").trim(),
            fields.active !== false,
          ],
        );
      } else {
        await query(
          `INSERT INTO crm_campaigns (id, name, channel, utm_source, utm_medium, utm_campaign, notes, active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            id,
            name,
            fields.channel || "meta",
            String(fields.utmSource || "").trim(),
            String(fields.utmMedium || "").trim(),
            String(fields.utmCampaign || "").trim(),
            String(fields.notes || "").trim(),
            fields.active !== false,
          ],
        );
      }
      res.json({ campaigns: await listCampaigns() });
      return;
    }
    if (action === "waitlistList") {
      res.json({ people: await listWaitlist() });
      return;
    }
    if (action === "waitlistUpdate") {
      const id = String(req.body?.id || "");
      if (!id) {
        res.status(400).json({ error: "id required." });
        return;
      }
      await query(`UPDATE waitlist SET platform = $2, updated_at = NOW() WHERE id = $1`, [
        id,
        String(req.body?.platform || ""),
      ]);
      const person = (await query(`SELECT * FROM waitlist WHERE id = $1`, [id])).rows[0];
      if (person) {
        await upsertCrmLead(
          {
            email: person.email,
            name: person.display_name,
            waitlistId: person.id,
            platform: person.platform,
            source: person.source,
          },
          { activityType: "system" },
        );
      }
      res.json({ people: await listWaitlist() });
      return;
    }
    if (action === "waitlistInvite") {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String).filter(Boolean) : [];
      for (const id of ids.slice(0, 500)) {
        await query(`UPDATE waitlist SET status = 'invited', updated_at = NOW() WHERE id = $1`, [id]);
        const person = (await query(`SELECT * FROM waitlist WHERE id = $1`, [id])).rows[0];
        if (person) {
          await upsertCrmLead(
            {
              email: person.email,
              name: person.display_name,
              waitlistId: person.id,
              stage: "invited",
              source: person.source,
            },
            { activityType: "stage_change", activityText: "Invited from waitlist" },
          );
        }
      }
      res.json({ people: await listWaitlist() });
      return;
    }
    if (action === "waitlistRemove") {
      const id = String(req.body?.id || "");
      if (!id) {
        res.status(400).json({ error: "id required." });
        return;
      }
      await query(`DELETE FROM waitlist WHERE id = $1`, [id]);
      res.json({ people: await listWaitlist() });
      return;
    }
    if (action === "sync") {
      const waitlistCount = await syncFromWaitlist();
      const affiliateCount = await syncFromAffiliateLeads();
      res.json({
        ok: true,
        waitlistCount,
        affiliateCount,
        leads: await listLeads(),
        campaigns: await listCampaigns(),
      });
      return;
    }
    if (action === "importDump") {
      // Accepts the JSON shape written by scripts/migrate-firestore-to-postgres.js
      const bundle = req.body?.bundle || req.body || {};
      const people = Array.isArray(bundle.waitlist) ? bundle.waitlist : [];
      let imported = 0;
      for (const row of people) {
        await joinWaitlist({
          email: row.email,
          displayName: row.displayName || row.name,
          photoURL: row.photoURL,
          phone: row.phone,
          platform: row.platform,
          source: row.source,
          utmSource: row.utmSource,
          utmMedium: row.utmMedium,
          utmCampaign: row.utmCampaign,
          fbclid: row.fbclid,
          firebaseUid: row.firebaseUid || row.id,
        });
        if (row.status === "invited" && row.email) {
          const found = await query(`SELECT id FROM waitlist WHERE LOWER(email) = $1 LIMIT 1`, [
            String(row.email).trim().toLowerCase(),
          ]);
          if (found.rows[0]) {
            await query(`UPDATE waitlist SET status = 'invited', updated_at = NOW() WHERE id = $1`, [found.rows[0].id]);
            await upsertCrmLead(
              { email: row.email, stage: "invited", waitlistId: found.rows[0].id },
              { activityType: "system" },
            );
          }
        }
        imported += 1;
      }
      res.json({
        ok: true,
        imported,
        people: await listWaitlist(),
        leads: await listLeads(),
      });
      return;
    }

    res.status(400).json({ error: "Unknown action." });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Request failed." });
  }
}

export async function handleWaitlistJoin(req, res) {
  try {
    const person = await joinWaitlist(req.body || {});
    res.json({ ok: true, person });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Could not join waitlist." });
  }
}

export async function handleWaitlistStatus(req, res) {
  try {
    const email = normalizeEmail(req.body?.email || req.query?.email);
    if (!email) {
      res.status(400).json({ error: "email required" });
      return;
    }
    const { rows } = await query(`SELECT id FROM waitlist WHERE LOWER(email) = $1 LIMIT 1`, [email]);
    res.json({ joined: Boolean(rows[0]), id: rows[0]?.id || "" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Status check failed." });
  }
}
