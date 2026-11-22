import { query, newId } from "../db.js";
import {
  adminUser,
  requireAdmin,
  signAdminToken,
  verifyAdminPassword,
  hashPassword,
  randomPassword,
  readBearer,
  verifyToken,
} from "../authTokens.js";
import { commissionFromSale, normalizeCode, suggestCode } from "./util.js";
import { ensureDodoDiscount, dodoApiConfigured } from "./dodo.js";
import { siteOrigin } from "./constants.js";
import { defaultCommissionBps } from "./constants.js";

function iso(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

async function listLeads() {
  const { rows } = await query(
    `SELECT * FROM affiliate_leads
     WHERE status IN ('new','contacted','rejected','onboarded')
     ORDER BY created_at DESC
     LIMIT 300`,
  );
  return rows.map((row) => ({
    id: row.id,
    kind: "lead",
    displayName: row.display_name || "",
    email: row.email || "",
    instagram: row.instagram || "",
    youtube: row.youtube || "",
    snapchat: row.snapchat || "",
    linkedin: row.linkedin || "",
    discord: row.discord || "",
    telegram: row.telegram || "",
    website: row.website || "",
    note: row.note || "",
    status: row.status || "new",
    affiliateId: row.affiliate_id || "",
    createdAt: iso(row.created_at),
  }));
}

async function listAffiliates() {
  const { rows } = await query(`SELECT * FROM affiliates ORDER BY created_at DESC`);
  const out = [];
  for (const row of rows) {
    const conv = await query(
      `SELECT status, sale_amount_cents, commission_amount_cents
       FROM affiliate_conversions WHERE affiliate_id = $1 LIMIT 500`,
      [row.id],
    );
    let conversions = 0;
    let revenueCents = 0;
    let commissionCents = 0;
    for (const c of conv.rows) {
      if (c.status === "reversed") continue;
      conversions += 1;
      revenueCents += Number(c.sale_amount_cents) || 0;
      commissionCents += Number(c.commission_amount_cents) || 0;
    }
    out.push({
      id: row.id,
      kind: "affiliate",
      displayName: row.display_name || "",
      email: row.email || "",
      instagram: row.instagram || "",
      youtube: row.youtube || "",
      website: row.website || "",
      couponCode: row.coupon_code || "",
      commissionRateBps: row.commission_rate_bps || 0,
      status: row.status || "pending",
      conversions,
      revenueCents,
      commissionCents,
      createdAt: iso(row.created_at),
    });
  }
  out.sort((a, b) => b.commissionCents - a.commissionCents);
  return out;
}

async function listRecentConversions(limit = 150) {
  const { rows } = await query(
    `SELECT c.*, a.display_name, a.email AS affiliate_email
     FROM affiliate_conversions c
     LEFT JOIN affiliates a ON a.id = c.affiliate_id
     ORDER BY c.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map((row) => ({
    id: row.id,
    affiliateId: row.affiliate_id || "",
    affiliateName: row.display_name || "",
    affiliateEmail: row.affiliate_email || "",
    couponCode: row.coupon_code || "",
    orderId: row.order_id || row.id,
    saleAmountCents: Number(row.sale_amount_cents) || 0,
    commissionAmountCents: Number(row.commission_amount_cents) || 0,
    currency: row.currency || "USD",
    status: row.status || "pending",
    eventType: row.event_type || "",
    orderAt: iso(row.order_at) || iso(row.created_at),
    createdAt: iso(row.created_at),
  }));
}

async function listRecentPayments(limit = 150) {
  const { rows } = await query(
    `SELECT p.*, a.display_name AS affiliate_name
     FROM payment_records p
     LEFT JOIN affiliates a ON a.id = p.affiliate_id
     ORDER BY p.paid_at DESC NULLS LAST, p.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map((row) => ({
    id: row.id,
    subscriptionId: row.subscription_id || "",
    customerEmail: row.customer_email || "",
    customerName: row.customer_name || "",
    amountCents: Number(row.amount_cents) || 0,
    currency: row.currency || "USD",
    status: row.status || "paid",
    eventType: row.event_type || "",
    couponCode: row.coupon_code || "",
    affiliateName: row.affiliate_name || "",
    paidAt: iso(row.paid_at) || iso(row.created_at),
  }));
}

async function masterMetrics() {
  const affiliates = await listAffiliates();
  const { rows } = await query(`SELECT * FROM affiliate_conversions LIMIT 2000`);
  const paymentTotals = await query(
    `SELECT COUNT(*) FILTER (WHERE status = 'paid')::INTEGER AS paid_customers,
            COALESCE(SUM(amount_cents) FILTER (WHERE status = 'paid'), 0)::INTEGER AS paid_revenue
     FROM payment_records`,
  );
  let totalRevenue = 0;
  let totalCommission = 0;
  let totalConversions = 0;
  let pendingPayoutCents = 0;
  let paidCommissionCents = 0;
  for (const row of rows) {
    if (row.status === "reversed") continue;
    totalConversions += 1;
    totalRevenue += Number(row.sale_amount_cents) || 0;
    totalCommission += Number(row.commission_amount_cents) || 0;
    if (row.status === "paid") paidCommissionCents += Number(row.commission_amount_cents) || 0;
    else pendingPayoutCents += Number(row.commission_amount_cents) || 0;
  }
  const leads = await listLeads();
  return {
    totalRevenueCents: totalRevenue,
    totalCommissionCents: totalCommission,
    pendingPayoutCents,
    paidCommissionCents,
    totalConversions,
    paidCustomers: Number(paymentTotals.rows[0]?.paid_customers) || 0,
    paidRevenueCents: Number(paymentTotals.rows[0]?.paid_revenue) || 0,
    activeAffiliates: affiliates.filter((a) => a.status === "active").length,
    totalAffiliates: affiliates.length,
    affiliateLeads: leads.filter((l) => l.status === "new" || l.status === "contacted").length,
    affiliates,
    leads,
    conversions: await listRecentConversions(150),
    payments: await listRecentPayments(150),
  };
}

async function listTickets() {
  const { rows } = await query(`SELECT * FROM affiliate_tickets ORDER BY updated_at DESC LIMIT 200`);
  return rows.map((row) => ({
    id: row.id,
    affiliateId: row.affiliate_id,
    affiliateName: row.affiliate_name,
    affiliateEmail: row.affiliate_email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    adminReply: row.admin_reply,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  }));
}

async function onboardLead(leadId, fields) {
  const { rows } = await query(`SELECT * FROM affiliate_leads WHERE id = $1`, [leadId]);
  const lead = rows[0];
  if (!lead) {
    const error = new Error("Lead not found.");
    error.status = 404;
    throw error;
  }
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
  const displayName = String(lead.display_name || "").trim() || email;
  const existing = await query(`SELECT id FROM affiliates WHERE email = $1`, [email]);
  if (existing.rows.length) {
    const error = new Error("An affiliate profile already exists for this email.");
    error.status = 409;
    throw error;
  }

  let couponCode = normalizeCode(fields.couponCode || "");
  if (couponCode.length < 3) couponCode = suggestCode(displayName);
  const taken = await query(`SELECT code FROM affiliate_codes WHERE code = $1`, [couponCode]);
  if (taken.rows.length) couponCode = suggestCode(displayName);

  const commissionRateBps =
    fields.commissionRateBps != null
      ? Math.min(5000, Math.max(0, Math.floor(Number(fields.commissionRateBps))))
      : defaultCommissionBps;
  const activateNow = fields.activateNow !== false;
  const tempPassword = randomPassword(14);
  const passwordHash = await hashPassword(tempPassword);
  const affiliateId = newId();
  const socialHandles = [lead.instagram, lead.youtube, lead.snapchat, lead.linkedin, lead.discord, lead.telegram]
    .filter(Boolean)
    .join(" · ");

  if (activateNow && dodoApiConfigured()) {
    await ensureDodoDiscount({ code: couponCode, affiliateId, commissionBps: commissionRateBps, required: true });
  }

  await query(
    `INSERT INTO affiliates (
      id, email, password_hash, display_name, instagram, youtube, snapchat, linkedin, discord, telegram,
      website, social_handles, payout_info, coupon_code, commission_rate_bps, status, lead_id, approved_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'',$13,$14,$15,$16, CASE WHEN $17 THEN NOW() ELSE NULL END
    )`,
    [
      affiliateId,
      email,
      passwordHash,
      displayName,
      lead.instagram || "",
      lead.youtube || "",
      lead.snapchat || "",
      lead.linkedin || "",
      lead.discord || "",
      lead.telegram || "",
      lead.website || "",
      socialHandles,
      couponCode,
      commissionRateBps,
      activateNow ? "active" : "pending",
      leadId,
      activateNow,
    ],
  );

  await query(
    `INSERT INTO affiliate_codes (code, affiliate_id, active) VALUES ($1,$2,$3)
     ON CONFLICT (code) DO UPDATE SET affiliate_id = EXCLUDED.affiliate_id, active = EXCLUDED.active, updated_at = NOW()`,
    [couponCode, affiliateId, activateNow],
  );

  await query(
    `UPDATE affiliate_leads SET status = 'onboarded', affiliate_id = $2, updated_at = NOW() WHERE id = $1`,
    [leadId, affiliateId],
  );

  return {
    email,
    couponCode,
    temporaryPassword: tempPassword,
    shareUrl: `${siteOrigin}/?ref=${encodeURIComponent(couponCode)}`,
    loginUrl: `${siteOrigin}/affiliate/login`,
  };
}

async function approveAffiliate(affiliateId) {
  const { rows } = await query(`SELECT * FROM affiliates WHERE id = $1`, [affiliateId]);
  const aff = rows[0];
  if (!aff) {
    const error = new Error("Affiliate not found.");
    error.status = 404;
    throw error;
  }
  if (dodoApiConfigured()) {
    await ensureDodoDiscount({
      code: aff.coupon_code,
      affiliateId,
      commissionBps: aff.commission_rate_bps || 1500,
      required: true,
    });
  }
  await query(
    `UPDATE affiliates SET status = 'active', approved_at = COALESCE(approved_at, NOW()), updated_at = NOW() WHERE id = $1`,
    [affiliateId],
  );
  await query(`UPDATE affiliate_codes SET active = TRUE, updated_at = NOW() WHERE code = $1`, [aff.coupon_code]);
}

async function updateAffiliate(affiliateId, fields) {
  const { rows } = await query(`SELECT * FROM affiliates WHERE id = $1`, [affiliateId]);
  const snap = rows[0];
  if (!snap) {
    const error = new Error("Affiliate not found.");
    error.status = 404;
    throw error;
  }

  let couponCode = snap.coupon_code;
  let commissionRateBps = snap.commission_rate_bps;
  let status = snap.status;

  if (fields.commissionRateBps != null) {
    commissionRateBps = Math.min(5000, Math.max(0, Math.floor(Number(fields.commissionRateBps))));
  }
  if (fields.status === "suspended" || fields.status === "pending" || fields.status === "active") {
    status = fields.status;
  }
  if (fields.couponCode) {
    const next = normalizeCode(fields.couponCode);
    if (next.length >= 3 && next !== couponCode) {
      const taken = await query(`SELECT affiliate_id FROM affiliate_codes WHERE code = $1`, [next]);
      if (taken.rows.length && taken.rows[0].affiliate_id !== affiliateId) {
        const error = new Error("That coupon code is already assigned.");
        error.status = 409;
        throw error;
      }
      couponCode = next;
    }
  }

  if (status === "active" && dodoApiConfigured()) {
    await ensureDodoDiscount({ code: couponCode, affiliateId, commissionBps: commissionRateBps, required: true });
  }
  if (couponCode !== snap.coupon_code) {
    await query(`DELETE FROM affiliate_codes WHERE code = $1`, [snap.coupon_code]);
    await query(
      `INSERT INTO affiliate_codes (code, affiliate_id, active) VALUES ($1,$2,$3)`,
      [couponCode, affiliateId, status === "active"],
    );
  }
  await query(
    `UPDATE affiliates SET coupon_code = $2, commission_rate_bps = $3, status = $4, updated_at = NOW() WHERE id = $1`,
    [affiliateId, couponCode, commissionRateBps, status],
  );
  await query(`UPDATE affiliate_codes SET active = $2, updated_at = NOW() WHERE code = $1`, [
    couponCode,
    status === "active",
  ]);

  return { ok: true };
}

export async function handleAffiliateAdmin(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only." });
    return;
  }

  const action = req.body?.action;

  if (action === "login") {
    if (!verifyAdminPassword(req.body?.username || adminUser, req.body?.password || "")) {
      res.status(401).json({ error: "Wrong username or password." });
      return;
    }
    res.json({ token: signAdminToken(), ...(await masterMetrics()) });
    return;
  }

  const bearer = readBearer(req);
  const payload = verifyToken(bearer);
  const authed = payload?.role === "admin" || Boolean(requireAdmin(req));
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
      await approveAffiliate(String(req.body?.affiliateId || ""));
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
      await query(
        `UPDATE affiliate_tickets SET admin_reply = $2, status = $3, updated_at = NOW() WHERE id = $1`,
        [id, reply, status],
      );
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
      await query(
        `UPDATE affiliate_leads SET status = 'rejected', admin_note = $2, updated_at = NOW() WHERE id = $1`,
        [leadId, String(req.body?.adminNote || "").slice(0, 500)],
      );
      res.json(await masterMetrics());
      return;
    }
    if (action === "markLeadContacted") {
      const leadId = String(req.body?.leadId || "");
      if (!leadId) {
        res.status(400).json({ error: "Lead id required." });
        return;
      }
      await query(`UPDATE affiliate_leads SET status = 'contacted', updated_at = NOW() WHERE id = $1`, [leadId]);
      res.json(await masterMetrics());
      return;
    }
    if (action === "recordManualSale") {
      const affiliateId = String(req.body?.affiliateId || "");
      const orderId = String(req.body?.orderId || newId());
      const saleAmountCents = Math.floor(Number(req.body?.saleAmountCents) || 0);
      const { rows } = await query(`SELECT * FROM affiliates WHERE id = $1`, [affiliateId]);
      if (!rows[0]) {
        res.status(404).json({ error: "Affiliate not found." });
        return;
      }
      const rate = rows[0].commission_rate_bps || 1500;
      const commissionAmountCents = commissionFromSale(saleAmountCents, rate);
      await query(
        `INSERT INTO affiliate_conversions (
          id, affiliate_id, order_id, sale_amount_cents, commission_amount_cents, currency, coupon_code, status, event_type, order_at
        ) VALUES ($1,$2,$3,$4,$5,'USD',$6,'pending','manual',NOW())`,
        [orderId, affiliateId, orderId, saleAmountCents, commissionAmountCents, rows[0].coupon_code || ""],
      );
      res.json(await masterMetrics());
      return;
    }
    if (action === "markConversionsPaid") {
      const ids = Array.isArray(req.body?.conversionIds)
        ? req.body.conversionIds.map((id) => String(id || "").trim()).filter(Boolean)
        : [];
      if (!ids.length) {
        res.status(400).json({ error: "conversionIds required." });
        return;
      }
      let updated = 0;
      for (const id of ids.slice(0, 200)) {
        const result = await query(
          `UPDATE affiliate_conversions
           SET status = 'paid', paid_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND status NOT IN ('paid','reversed')`,
          [id],
        );
        updated += result.rowCount || 0;
      }
      res.json({ ...(await masterMetrics()), markedPaid: updated });
      return;
    }
    res.status(400).json({ error: "Unknown action." });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Request failed." });
  }
}
