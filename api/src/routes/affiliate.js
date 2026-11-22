import { Router } from "express";
import { query, newId } from "../db.js";
import {
  requireAffiliate,
  signAffiliateToken,
  hashPassword,
  checkPassword,
  readBearer,
  verifyToken,
} from "../authTokens.js";
import { normalizeCode, rangeBounds, iso } from "../lib/util.js";
import { createFlipurCheckoutSession, productIdsConfigured } from "../lib/dodo.js";
import { normalizePlan, PRICING_PLANS } from "../lib/pricing.js";
import { siteOrigin } from "../lib/constants.js";
import { httpError, sendError } from "../lib/httpError.js";

const router = Router();

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

router.post("/open", async (req, res) => {
  try {
    const code = normalizeCode(req.body?.code);
    const visitorKey = String(req.body?.visitorKey || "").trim();
    if (!code) throw httpError(400, "Referral code is required.");
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(visitorKey)) {
      throw httpError(400, "A valid visitor identifier is required.");
    }

    const { rows } = await query(
      `SELECT a.id
       FROM affiliates a
       LEFT JOIN affiliate_codes c ON c.affiliate_id = a.id AND c.code = $1
       WHERE a.coupon_code = $1 OR c.code = $1
       LIMIT 1`,
      [code],
    );
    if (!rows[0]) {
      res.json({ ok: true, recorded: false });
      return;
    }
    await query(
      `INSERT INTO affiliate_link_opens (id, affiliate_id, visitor_key)
       VALUES ($1, $2, $3)`,
      [newId(), rows[0].id, visitorKey],
    );
    res.json({ ok: true, recorded: true });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/interest", async (req, res) => {
  try {
    const displayName = String(req.body?.displayName || "").trim().slice(0, 120);
    const email = normalizeEmail(req.body?.email);
    const instagram = String(req.body?.instagram || "").trim().slice(0, 200);
    const youtube = String(req.body?.youtube || "").trim().slice(0, 200);
    const snapchat = String(req.body?.snapchat || "").trim().slice(0, 200);
    const linkedin = String(req.body?.linkedin || "").trim().slice(0, 200);
    const discord = String(req.body?.discord || "").trim().slice(0, 200);
    const telegram = String(req.body?.telegram || "").trim().slice(0, 200);
    const website = String(req.body?.website || "").trim().slice(0, 300);
    const note = String(req.body?.note || "").trim().slice(0, 2000);

    if (!displayName || !email) throw httpError(400, "Name and email are required.");
    if (!instagram && !youtube && !snapchat && !linkedin && !discord && !telegram) {
      throw httpError(
        400,
        "Share at least one of Instagram, YouTube, Snapchat, LinkedIn, Discord, or Telegram.",
      );
    }

    const open = await query(
      `SELECT id FROM affiliate_leads WHERE email = $1 AND status IN ('new','contacted') LIMIT 1`,
      [email],
    );
    if (open.rows[0]) {
      res.json({ ok: true, alreadySubmitted: true, leadId: open.rows[0].id });
      return;
    }

    const existingAff = await query(`SELECT id FROM affiliates WHERE email = $1 LIMIT 1`, [email]);
    if (existingAff.rows[0]) throw httpError(409, "This email already has an affiliate profile.");

    const id = newId();
    await query(
      `INSERT INTO affiliate_leads (
        id, display_name, email, instagram, youtube, snapchat, linkedin, discord, telegram, website, note, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'new')`,
      [id, displayName, email, instagram, youtube, snapchat, linkedin, discord, telegram, website, note],
    );
    res.json({ ok: true, leadId: id });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    if (!email || !password) throw httpError(400, "Email and password are required.");
    const { rows } = await query(`SELECT * FROM affiliates WHERE email = $1 LIMIT 1`, [email]);
    const aff = rows[0];
    if (!aff || !(await checkPassword(password, aff.password_hash))) {
      throw httpError(401, "Wrong email or password.");
    }
    const token = signAffiliateToken({ id: aff.id, email: aff.email });
    res.json({
      token,
      profile: {
        id: aff.id,
        email: aff.email,
        displayName: aff.display_name,
        status: aff.status,
        couponCode: aff.coupon_code,
      },
    });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/me", async (req, res) => {
  try {
    const payload = requireAffiliate(req);
    if (!payload) throw httpError(401, "Sign in required.");
    const { rows } = await query(`SELECT * FROM affiliates WHERE id = $1`, [payload.sub]);
    if (!rows[0]) throw httpError(401, "Sign in required.");
    const aff = rows[0];
    res.json({
      user: {
        uid: aff.id,
        email: aff.email,
        displayName: aff.display_name,
      },
    });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/dashboard", async (req, res) => {
  try {
    const payload = requireAffiliate(req);
    if (!payload) throw httpError(401, "Sign in required.");
    const { rows } = await query(`SELECT * FROM affiliates WHERE id = $1`, [payload.sub]);
    const profile = rows[0];
    if (!profile) {
      throw httpError(
        404,
        "Your dashboard is not ready yet. Flipur onboards partners by invite—contact us if you already applied.",
      );
    }

    const range = ["wow", "mom", "lifetime"].includes(req.body?.range) ? req.body.range : "lifetime";
    const bounds = rangeBounds(range);
    const conv = await query(
      `SELECT * FROM affiliate_conversions WHERE affiliate_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [profile.id],
    );
    const linkOpens = await query(
      `SELECT
         COUNT(*)::INTEGER AS lifetime,
         COUNT(*) FILTER (WHERE created_at >= to_timestamp($2 / 1000.0) AND created_at <= to_timestamp($3 / 1000.0))::INTEGER AS in_range
       FROM affiliate_link_opens
       WHERE affiliate_id = $1`,
      [profile.id, bounds.start, bounds.end],
    );

    const conversions = [];
    let lifetimeEarnings = 0;
    let pendingPayout = 0;
    let rangeEarnings = 0;
    let rangeCount = 0;

    for (const row of conv.rows) {
      const createdMs = new Date(row.created_at || row.order_at || 0).getTime() || 0;
      const commission = Number(row.commission_amount_cents) || 0;
      const inRange = createdMs >= bounds.start && createdMs <= bounds.end;
      if (row.status !== "reversed") {
        lifetimeEarnings += commission;
        if (row.status === "pending" || row.status === "approved") pendingPayout += commission;
        if (inRange) {
          rangeEarnings += commission;
          rangeCount += 1;
        }
      }
      conversions.push({
        id: row.id,
        orderId: row.order_id,
        saleAmountCents: row.sale_amount_cents,
        commissionAmountCents: commission,
        status: row.status,
        orderAt: iso(row.order_at) || iso(row.created_at),
      });
    }

    const ticketsSnap = await query(
      `SELECT * FROM affiliate_tickets WHERE affiliate_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [profile.id],
    );
    const tickets = ticketsSnap.rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      message: row.message,
      status: row.status,
      adminReply: row.admin_reply,
      createdAt: iso(row.created_at),
    }));

    res.json({
      profile: {
        displayName: profile.display_name,
        email: profile.email,
        status: profile.status,
        couponCode: profile.coupon_code,
        commissionRateBps: profile.commission_rate_bps,
        shareUrl: `${siteOrigin}/?ref=${encodeURIComponent(profile.coupon_code)}`,
      },
      metrics: {
        range,
        totalLifetimeEarningsCents: lifetimeEarnings,
        pendingPayoutCents: pendingPayout,
        rangeEarningsCents: rangeEarnings,
        rangeConversions: rangeCount,
        totalConversions: conversions.filter((c) => c.status !== "reversed").length,
        rangeLinkOpens: Number(linkOpens.rows[0]?.in_range) || 0,
        totalLinkOpens: Number(linkOpens.rows[0]?.lifetime) || 0,
      },
      conversions,
      tickets,
    });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ticket", async (req, res) => {
  try {
    const payload = requireAffiliate(req);
    if (!payload) throw httpError(401, "Sign in required.");
    const { rows } = await query(`SELECT * FROM affiliates WHERE id = $1`, [payload.sub]);
    const profile = rows[0];
    if (!profile) throw httpError(404, "Affiliate profile not found.");
    const subject = String(req.body?.subject || "").trim().slice(0, 120);
    const message = String(req.body?.message || "").trim().slice(0, 4000);
    if (!subject || !message) throw httpError(400, "Subject and message are required.");
    const id = newId();
    await query(
      `INSERT INTO affiliate_tickets (
        id, affiliate_id, affiliate_name, affiliate_email, subject, message, status, admin_reply
      ) VALUES ($1,$2,$3,$4,$5,$6,'open','')`,
      [id, profile.id, profile.display_name || "", profile.email || "", subject, message],
    );
    res.json({ ok: true, ticketId: id });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/checkout", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim();
    if (!email) throw httpError(400, "Email is required.");
    const name = String(req.body?.name || "").trim();
    const discountCode = normalizeCode(req.body?.discountCode || req.body?.ref || "");
    const plan = normalizePlan(req.body?.plan);
    const autoRenew = Boolean(req.body?.autoRenew);
    const result = await createFlipurCheckoutSession({ email, name, discountCode, plan, autoRenew });
    res.json(result);
  } catch (err) {
    if (!err.status) err.status = 400;
    sendError(res, err);
  }
});

router.get("/pricing", (_req, res) => {
  const ids = productIdsConfigured();
  res.json({
    plans: PRICING_PLANS,
    checkoutConfigured: { monthly: ids.monthly, yearly: ids.yearly },
  });
});

/** Optional: change password after onboard */
router.post("/change-password", async (req, res) => {
  try {
    const payload = requireAffiliate(req);
    if (!payload) throw httpError(401, "Sign in required.");
    const currentPassword = String(req.body?.currentPassword || "");
    const nextPassword = String(req.body?.newPassword || "");
    if (nextPassword.length < 8) throw httpError(400, "New password must be at least 8 characters.");
    const { rows } = await query(`SELECT * FROM affiliates WHERE id = $1`, [payload.sub]);
    const aff = rows[0];
    if (!aff || !(await checkPassword(currentPassword, aff.password_hash))) {
      throw httpError(401, "Current password is wrong.");
    }
    await query(`UPDATE affiliates SET password_hash = $2, updated_at = NOW() WHERE id = $1`, [
      aff.id,
      await hashPassword(nextPassword),
    ]);
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
