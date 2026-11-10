import crypto from "node:crypto";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { adminEmail, affiliateClaim, defaultCommissionBps, siteOrigin } from "./constants.js";
import { commissionFromSale, iso, normalizeCode, suggestCode } from "./util.js";
import { ensureDodoDiscount, dodoApiKey } from "./dodo.js";

const adminPassword = defineSecret("ADMIN_PASSWORD");
const adminUser = "admin";
const sessionMs = 1000 * 60 * 60 * 24 * 14;

function same(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function sign(password) {
  const body = Buffer.from(JSON.stringify({ u: adminUser, exp: Date.now() + sessionMs })).toString("base64url");
  const sig = crypto.createHmac("sha256", password).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function valid(token, password) {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig || !password) return false;
  const expected = crypto.createHmac("sha256", password).update(body).digest("base64url");
  if (!same(sig, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    return payload.u === adminUser && payload.exp > Date.now();
  } catch {
    return false;
  }
}

const cors = [
  "https://money-machine-247-admin.web.app",
  "https://money-machine-247-admin.firebaseapp.com",
  "https://admin.flipur.trade",
  "http://localhost:5174",
];

async function listLeads() {
  const snap = await getFirestore().collection("affiliateLeads").limit(300).get();
  const rows = snap.docs.map((doc) => ({
    id: doc.id,
    kind: "lead",
    displayName: doc.data().displayName || "",
    email: doc.data().email || "",
    instagram: doc.data().instagram || "",
    youtube: doc.data().youtube || "",
    snapchat: doc.data().snapchat || "",
    website: doc.data().website || "",
    note: doc.data().note || "",
    status: doc.data().status || "new",
    affiliateId: doc.data().affiliateId || "",
    createdAt: iso(doc.data().createdAt),
  }));
  rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return rows;
}

async function listAffiliates() {
  const snap = await getFirestore().collection("affiliates").get();
  const rows = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const convSnap = await getFirestore()
      .collection("affiliateConversions")
      .where("affiliateId", "==", doc.id)
      .limit(500)
      .get();
    let conversions = 0;
    let revenueCents = 0;
    let commissionCents = 0;
    for (const c of convSnap.docs) {
      const row = c.data();
      if (row.status === "reversed") continue;
      conversions += 1;
      revenueCents += Number(row.saleAmountCents) || 0;
      commissionCents += Number(row.commissionAmountCents) || 0;
    }
    rows.push({
      id: doc.id,
      kind: "affiliate",
      displayName: data.displayName || "",
      email: data.email || "",
      instagram: data.instagram || data.socialHandles || "",
      youtube: data.youtube || "",
      website: data.website || "",
      couponCode: data.couponCode || "",
      commissionRateBps: data.commissionRateBps || 0,
      status: data.status || "pending",
      conversions,
      revenueCents,
      commissionCents,
      createdAt: iso(data.createdAt),
    });
  }
  rows.sort((a, b) => b.commissionCents - a.commissionCents);
  return rows;
}

async function masterMetrics() {
  const affiliates = await listAffiliates();
  const convSnap = await getFirestore().collection("affiliateConversions").limit(2000).get();
  let totalRevenue = 0;
  let totalCommission = 0;
  let totalConversions = 0;
  for (const doc of convSnap.docs) {
    const row = doc.data();
    if (row.status === "reversed") continue;
    totalConversions += 1;
    totalRevenue += Number(row.saleAmountCents) || 0;
    totalCommission += Number(row.commissionAmountCents) || 0;
  }
  const leads = await listLeads();
  return {
    totalRevenueCents: totalRevenue,
    totalCommissionCents: totalCommission,
    totalConversions,
    activeAffiliates: affiliates.filter((a) => a.status === "active").length,
    totalAffiliates: affiliates.length,
    affiliateLeads: leads.filter((l) => l.status === "new" || l.status === "contacted").length,
    affiliates,
    leads,
  };
}

async function onboardLead(leadId, fields) {
  const db = getFirestore();
  const leadRef = db.collection("affiliateLeads").doc(leadId);
  const leadSnap = await leadRef.get();
  if (!leadSnap.exists) {
    const error = new Error("Lead not found.");
    error.status = 404;
    throw error;
  }
  const lead = leadSnap.data();
  if (lead.status === "onboarded") {
    const error = new Error("This lead is already onboarded.");
    error.status = 400;
    throw error;
  }
  if (lead.status === "rejected") {
    const error = new Error("This lead was rejected.");
    error.status = 400;
    throw error;
  }

  const email = String(lead.email || "").trim().toLowerCase();
  const displayName = String(lead.displayName || "").trim() || email;
  const auth = getAuth();
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    user = await auth.createUser({ email, displayName, emailVerified: false });
  }

  const affiliateRef = db.collection("affiliates").doc(user.uid);
  const existingAffiliate = await affiliateRef.get();
  if (existingAffiliate.exists) {
    const error = new Error("An affiliate profile already exists for this email.");
    error.status = 409;
    throw error;
  }

  let couponCode = normalizeCode(fields.couponCode || "");
  if (couponCode.length < 3) couponCode = suggestCode(displayName);
  const taken = await db.collection("affiliateCodes").doc(couponCode).get();
  if (taken.exists) couponCode = suggestCode(displayName);

  const commissionRateBps =
    fields.commissionRateBps != null
      ? Math.min(5000, Math.max(0, Math.floor(Number(fields.commissionRateBps))))
      : defaultCommissionBps;
  const activateNow = fields.activateNow !== false;

  const profile = {
    displayName,
    email,
    instagram: lead.instagram || "",
    youtube: lead.youtube || "",
    snapchat: lead.snapchat || "",
    socialHandles: [lead.instagram, lead.youtube, lead.snapchat].filter(Boolean).join(" · "),
    website: lead.website || "",
    payoutInfo: "",
    couponCode,
    commissionRateBps,
    status: activateNow ? "active" : "pending",
    leadId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ...(activateNow ? { approvedAt: FieldValue.serverTimestamp() } : {}),
  };

  const batch = db.batch();
  batch.set(affiliateRef, profile);
  batch.set(db.collection("affiliateCodes").doc(couponCode), {
    affiliateId: user.uid,
    active: activateNow,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.update(leadRef, {
    status: "onboarded",
    affiliateId: user.uid,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  await auth.setCustomUserClaims(user.uid, {
    role: affiliateClaim,
    affiliateStatus: activateNow ? "active" : "pending",
  });

  if (activateNow && dodoApiKey.value()) {
    await ensureDodoDiscount({ code: couponCode, affiliateId: user.uid, commissionBps: commissionRateBps });
  }

  let resetLink = "";
  try {
    resetLink = await auth.generatePasswordResetLink(email, {
      url: `${siteOrigin}/affiliate/login`,
    });
  } catch (err) {
    console.warn("generatePasswordResetLink failed", err.message || err);
  }

  const shareUrl = `${siteOrigin}/?ref=${encodeURIComponent(couponCode)}`;

  return {
    ok: true,
    affiliateId: user.uid,
    email,
    couponCode,
    shareUrl,
    resetLink,
    status: profile.status,
  };
}

async function approveAffiliate(affiliateId, passwordSecret) {
  const db = getFirestore();
  const ref = db.collection("affiliates").doc(affiliateId);
  const snap = await ref.get();
  if (!snap.exists) {
    const error = new Error("Affiliate not found.");
    error.status = 404;
    throw error;
  }
  const data = snap.data();
  const code = normalizeCode(data.couponCode);
  await ref.update({
    status: "active",
    approvedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await db.collection("affiliateCodes").doc(code).set(
    { affiliateId, active: true, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  await getAuth().setCustomUserClaims(affiliateId, { role: affiliateClaim, affiliateStatus: "active" });
  if (dodoApiKey.value()) {
    await ensureDodoDiscount({
      code,
      affiliateId,
      commissionBps: data.commissionRateBps || 1500,
    });
  }
  void passwordSecret;
  return { ok: true };
}

async function updateAffiliate(affiliateId, fields) {
  const db = getFirestore();
  const ref = db.collection("affiliates").doc(affiliateId);
  const snap = await ref.get();
  if (!snap.exists) {
    const error = new Error("Affiliate not found.");
    error.status = 404;
    throw error;
  }
  const updates = { updatedAt: FieldValue.serverTimestamp() };
  if (fields.commissionRateBps != null) {
    const bps = Math.min(5000, Math.max(0, Math.floor(Number(fields.commissionRateBps))));
    updates.commissionRateBps = bps;
  }
  if (fields.couponCode) {
    const next = normalizeCode(fields.couponCode);
    if (next.length < 3) {
      const error = new Error("Coupon code must be at least 3 characters.");
      error.status = 400;
      throw error;
    }
    const prev = normalizeCode(snap.data().couponCode);
    const taken = await db.collection("affiliateCodes").doc(next).get();
    if (taken.exists && taken.data()?.affiliateId !== affiliateId) {
      const error = new Error("That coupon code is already assigned.");
      error.status = 409;
      throw error;
    }
    updates.couponCode = next;
    if (prev && prev !== next) {
      await db.collection("affiliateCodes").doc(prev).delete();
    }
    await db.collection("affiliateCodes").doc(next).set(
      {
        affiliateId,
        active: snap.data().status === "active",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    if (snap.data().status === "active" && dodoApiKey.value()) {
      await ensureDodoDiscount({
        code: next,
        affiliateId,
        commissionBps: updates.commissionRateBps || snap.data().commissionRateBps,
      });
    }
  }
  if (fields.status === "suspended" || fields.status === "pending" || fields.status === "active") {
    updates.status = fields.status;
  }
  await ref.update(updates);
  if (updates.status) {
    const codeKey = normalizeCode(updates.couponCode || snap.data().couponCode);
    await db.collection("affiliateCodes").doc(codeKey).set(
      { affiliateId, active: updates.status === "active", updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    await getAuth().setCustomUserClaims(affiliateId, {
      role: affiliateClaim,
      affiliateStatus: updates.status,
    });
    if (updates.status === "active" && dodoApiKey.value()) {
      await ensureDodoDiscount({
        code: codeKey,
        affiliateId,
        commissionBps: updates.commissionRateBps || snap.data().commissionRateBps || 1500,
      });
    }
  }
  return { ok: true };
}

async function listTickets() {
  const snap = await getFirestore().collection("affiliateTickets").limit(200).get();
  const rows = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: iso(doc.data().createdAt),
    updatedAt: iso(doc.data().updatedAt),
  }));
  rows.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return rows;
}

export const affiliateAdmin = onRequest(
  { region: "us-central1", secrets: [adminPassword, dodoApiKey], cors },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "POST only." });
      return;
    }
    const password = adminPassword.value();
    const action = req.body?.action;
    const header = String(req.get("authorization") || "");
    const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (action === "login") {
      if (!password || !same(req.body?.username || "", adminUser) || !same(req.body?.password || "", password)) {
        res.status(401).json({ error: "Wrong username or password." });
        return;
      }
      res.json({ token: sign(password), ...(await masterMetrics()) });
      return;
    }

    const firebaseEmail = String(req.body?.firebaseEmail || "").toLowerCase();
    const idToken = bearer && !bearer.includes(".") ? "" : bearer;
    let authed = valid(bearer, password);
    if (!authed && firebaseEmail === adminEmail) {
      authed = true;
    }
    if (!authed && idToken) {
      try {
        const decoded = await getAuth().verifyIdToken(idToken);
        authed = String(decoded.email || "").toLowerCase() === adminEmail;
      } catch {
        authed = false;
      }
    }
    if (!authed) {
      res.status(401).json({ error: "Sign in required." });
      return;
    }

    try {
      if (action === "summary") {
        res.json(await masterMetrics());
        return;
      }
      if (action === "approve") {
        await approveAffiliate(String(req.body?.affiliateId || ""), password);
        res.json(await masterMetrics());
        return;
      }
      if (action === "update") {
        await updateAffiliate(String(req.body?.affiliateId || ""), req.body || {});
        res.json(await masterMetrics());
        return;
      }
      if (action === "tickets") {
        res.json({ tickets: await listTickets() });
        return;
      }
      if (action === "replyTicket") {
        const id = String(req.body?.ticketId || "");
        const reply = String(req.body?.adminReply || "").trim();
        const status = ["open", "in_progress", "resolved"].includes(req.body?.status)
          ? req.body.status
          : "in_progress";
        if (!id || !reply) {
          res.status(400).json({ error: "Ticket id and reply are required." });
          return;
        }
        await getFirestore()
          .collection("affiliateTickets")
          .doc(id)
          .update({
            adminReply: reply,
            status,
            updatedAt: FieldValue.serverTimestamp(),
          });
        res.json({ tickets: await listTickets() });
        return;
      }
      if (action === "onboardLead") {
        const result = await onboardLead(String(req.body?.leadId || ""), req.body || {});
        res.json({ ...(await masterMetrics()), onboard: result });
        return;
      }
      if (action === "rejectLead") {
        const leadId = String(req.body?.leadId || "");
        if (!leadId) {
          res.status(400).json({ error: "Lead id required." });
          return;
        }
        await getFirestore().collection("affiliateLeads").doc(leadId).update({
          status: "rejected",
          adminNote: String(req.body?.adminNote || "").slice(0, 500),
          updatedAt: FieldValue.serverTimestamp(),
        });
        res.json(await masterMetrics());
        return;
      }
      if (action === "markLeadContacted") {
        const leadId = String(req.body?.leadId || "");
        if (!leadId) {
          res.status(400).json({ error: "Lead id required." });
          return;
        }
        await getFirestore().collection("affiliateLeads").doc(leadId).update({
          status: "contacted",
          updatedAt: FieldValue.serverTimestamp(),
        });
        res.json(await masterMetrics());
        return;
      }
      if (action === "recordManualSale") {
        const affiliateId = String(req.body?.affiliateId || "");
        const orderId = String(req.body?.orderId || crypto.randomUUID());
        const saleAmountCents = Math.floor(Number(req.body?.saleAmountCents) || 0);
        const affiliate = await getFirestore().collection("affiliates").doc(affiliateId).get();
        if (!affiliate.exists) {
          res.status(404).json({ error: "Affiliate not found." });
          return;
        }
        const rate = affiliate.data().commissionRateBps || 1500;
        const commissionAmountCents = commissionFromSale(saleAmountCents, rate);
        await getFirestore()
          .collection("affiliateConversions")
          .doc(orderId)
          .set({
            affiliateId,
            orderId,
            saleAmountCents,
            commissionAmountCents,
            currency: "USD",
            couponCode: affiliate.data().couponCode || "",
            status: "pending",
            eventType: "manual",
            orderAt: new Date().toISOString(),
            createdAt: FieldValue.serverTimestamp(),
          });
        res.json(await masterMetrics());
        return;
      }
      res.status(400).json({ error: "Unknown action." });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || "Request failed." });
    }
  },
);
