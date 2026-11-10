import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { adminEmail, defaultCommissionBps, siteOrigin } from "./constants.js";
import { normalizeCode, rangeBounds, suggestCode, iso } from "./util.js";
import {
  createFlipurCheckoutSession,
  dodoApiKey,
  dodoProductId,
  dodoProductIdMonthly,
  dodoProductIdYearly,
  dodoAutorenewDiscountCode,
} from "./dodo.js";
import { normalizePlan, PRICING_PLANS } from "./pricing.js";

function requireAuth(request) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Sign in required.");
  return request.auth.uid;
}

async function affiliateDoc(uid) {
  const snap = await getFirestore().collection("affiliates").doc(uid).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

const callableOpts = { region: "us-central1", cors: true, invoker: "public" };

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

/** Public interest form — no auth, no password. */
export const submitAffiliateInterest = onCall(callableOpts, async (request) => {
  const db = getFirestore();
  const displayName = String(request.data?.displayName || "").trim().slice(0, 120);
  const email = normalizeEmail(request.data?.email);
  const instagram = String(request.data?.instagram || request.data?.socialHandles || "").trim().slice(0, 200);
  const youtube = String(request.data?.youtube || "").trim().slice(0, 200);
  const snapchat = String(request.data?.snapchat || "").trim().slice(0, 200);
  const website = String(request.data?.website || "").trim().slice(0, 300);
  const note = String(request.data?.note || request.data?.message || "").trim().slice(0, 2000);

  if (!displayName || !email) {
    throw new HttpsError("invalid-argument", "Name and email are required.");
  }
  if (!instagram && !youtube && !snapchat && !website) {
    throw new HttpsError("invalid-argument", "Share at least one channel or website.");
  }

  const existingLead = await db.collection("affiliateLeads").where("email", "==", email).limit(5).get();
  const openLead = existingLead.docs.find((doc) => {
    const status = doc.data().status;
    return status === "new" || status === "contacted";
  });
  if (openLead) {
    return { ok: true, alreadySubmitted: true, leadId: openLead.id };
  }

  const activeAffiliate = await db.collection("affiliates").where("email", "==", email).limit(1).get();
  if (!activeAffiliate.empty) {
    throw new HttpsError("already-exists", "This email already has an affiliate profile.");
  }

  const ref = db.collection("affiliateLeads").doc();
  await ref.set({
    displayName,
    email,
    instagram,
    youtube,
    snapchat,
    website,
    note,
    status: "new",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, leadId: ref.id };
});

export const registerAffiliate = onCall(callableOpts, async (request) => {
  const uid = requireAuth(request);
  const db = getFirestore();
  const existing = await affiliateDoc(uid);
  if (existing) {
    return { ok: true, status: existing.status, couponCode: existing.couponCode };
  }

  const displayName = String(request.data?.displayName || request.auth.token.name || "").trim();
  const email = String(request.auth.token.email || "").trim().toLowerCase();
  const socialHandles = String(request.data?.socialHandles || "").trim();
  const website = String(request.data?.website || "").trim();
  const payoutInfo = String(request.data?.payoutInfo || "").trim();

  if (!displayName || !email) {
    throw new HttpsError("invalid-argument", "Name and email are required.");
  }

  let couponCode = normalizeCode(request.data?.couponCode || "");
  if (couponCode.length < 3) couponCode = suggestCode(displayName);
  const codeRef = db.collection("affiliateCodes").doc(couponCode);
  const taken = await codeRef.get();
  if (taken.exists) couponCode = suggestCode(displayName);

  const profile = {
    displayName,
    email,
    socialHandles,
    website,
    payoutInfo,
    couponCode,
    commissionRateBps: defaultCommissionBps,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const batch = db.batch();
  batch.set(db.collection("affiliates").doc(uid), profile);
  batch.set(db.collection("affiliateCodes").doc(couponCode), {
    affiliateId: uid,
    active: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  await getAuth().setCustomUserClaims(uid, { role: "affiliate", affiliateStatus: "pending" });

  return { ok: true, status: "pending", couponCode };
});

export const getAffiliateDashboard = onCall(callableOpts, async (request) => {
  const uid = requireAuth(request);
  const profile = await affiliateDoc(uid);
  if (!profile) {
    throw new HttpsError(
      "not-found",
      "Your dashboard is not ready yet. Flipur onboards partners by invite—contact us if you already applied.",
    );
  }

  const range = ["wow", "mom", "lifetime"].includes(request.data?.range) ? request.data.range : "lifetime";
  const bounds = rangeBounds(range);
  const db = getFirestore();

  const convSnap = await db
    .collection("affiliateConversions")
    .where("affiliateId", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(200)
    .get()
    .catch(async () => {
      const fallback = await db.collection("affiliateConversions").where("affiliateId", "==", uid).limit(200).get();
      return fallback;
    });

  const conversions = [];
  let lifetimeEarnings = 0;
  let pendingPayout = 0;
  let rangeEarnings = 0;
  let rangeCount = 0;

  for (const doc of convSnap.docs) {
    const row = doc.data();
    const createdMs = row.createdAt?.toDate?.()?.getTime?.() || new Date(row.orderAt || 0).getTime() || 0;
    const commission = Number(row.commissionAmountCents) || 0;
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
      id: doc.id,
      orderId: row.orderId,
      saleAmountCents: row.saleAmountCents,
      commissionAmountCents: commission,
      status: row.status,
      orderAt: row.orderAt || iso(row.createdAt),
    });
  }

  const ticketsSnap = await db
    .collection("affiliateTickets")
    .where("affiliateId", "==", uid)
    .limit(50)
    .get();
  const tickets = ticketsSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data(), createdAt: iso(doc.data().createdAt) }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const shareUrl = `${siteOrigin}/?ref=${encodeURIComponent(profile.couponCode)}`;

  return {
    profile: {
      displayName: profile.displayName,
      email: profile.email,
      status: profile.status,
      couponCode: profile.couponCode,
      commissionRateBps: profile.commissionRateBps,
      shareUrl,
    },
    metrics: {
      range,
      totalLifetimeEarningsCents: lifetimeEarnings,
      pendingPayoutCents: pendingPayout,
      rangeEarningsCents: rangeEarnings,
      rangeConversions: rangeCount,
      totalConversions: conversions.filter((c) => c.status !== "reversed").length,
    },
    conversions,
    tickets,
  };
});

export const submitAffiliateTicket = onCall(callableOpts, async (request) => {
  const uid = requireAuth(request);
  const profile = await affiliateDoc(uid);
  if (!profile) throw new HttpsError("not-found", "Affiliate profile not found.");
  const subject = String(request.data?.subject || "").trim().slice(0, 120);
  const message = String(request.data?.message || "").trim().slice(0, 4000);
  if (!subject || !message) throw new HttpsError("invalid-argument", "Subject and message are required.");

  const ref = getFirestore().collection("affiliateTickets").doc();
  await ref.set({
    affiliateId: uid,
    affiliateName: profile.displayName || "",
    affiliateEmail: profile.email || "",
    subject,
    message,
    status: "open",
    adminReply: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { ok: true, ticketId: ref.id };
});

export const createCheckoutSession = onCall(
  {
    ...callableOpts,
    secrets: [
      dodoApiKey,
      dodoProductId,
      dodoProductIdMonthly,
      dodoProductIdYearly,
      dodoAutorenewDiscountCode,
    ],
  },
  async (request) => {
    const email = String(request.data?.email || request.auth?.token?.email || "").trim();
    if (!email) throw new HttpsError("invalid-argument", "Email is required.");
    const name = String(request.data?.name || "").trim();
    const discountCode = normalizeCode(request.data?.discountCode || request.data?.ref || "");
    const plan = normalizePlan(request.data?.plan);
    const autoRenew = Boolean(request.data?.autoRenew);
    const session = await createFlipurCheckoutSession({ email, name, discountCode, plan, autoRenew });
    return session;
  },
);

export const getPricingCatalog = onCall(
  {
    ...callableOpts,
    secrets: [dodoApiKey, dodoProductId, dodoProductIdMonthly, dodoProductIdYearly],
  },
  async () => {
    const monthlyId = dodoProductIdMonthly.value() || dodoProductId.value() || "";
    const yearlyId = dodoProductIdYearly.value() || "";
    return {
      plans: PRICING_PLANS,
      checkoutConfigured: { monthly: Boolean(monthlyId), yearly: Boolean(yearlyId) },
    };
  },
);

export const isAffiliateAdmin = onCall(callableOpts, async (request) => {
  const email = String(request.auth?.token?.email || "").toLowerCase();
  return { isAdmin: email === adminEmail };
});
