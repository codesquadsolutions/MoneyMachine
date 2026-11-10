/**
 * Run from repo root (requires Firebase Admin creds):
 *   cd functions && node scripts/seedAffiliates.js
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const seeds = [
  {
    id: "seed-affiliate-alpha",
    displayName: "Alex Rivera",
    email: "alex@example.com",
    couponCode: "ALEXFLIP",
    commissionRateBps: 2000,
    status: "active",
  },
  {
    id: "seed-affiliate-beta",
    displayName: "Jordan Kim",
    email: "jordan@example.com",
    couponCode: "JORDAN15",
    commissionRateBps: 1500,
    status: "active",
  },
  {
    id: "seed-affiliate-gamma",
    displayName: "Sam Ortiz",
    email: "sam@example.com",
    couponCode: "SAMFLIP",
    commissionRateBps: 1500,
    status: "pending",
  },
];

async function main() {
  for (const row of seeds) {
    await db.collection("affiliates").doc(row.id).set({
      displayName: row.displayName,
      email: row.email,
      socialHandles: "@flipur",
      website: "https://example.com",
      payoutInfo: "PayPal: demo",
      couponCode: row.couponCode,
      commissionRateBps: row.commissionRateBps,
      status: row.status,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await db.collection("affiliateCodes").doc(row.couponCode).set({
      affiliateId: row.id,
      active: row.status === "active",
      createdAt: FieldValue.serverTimestamp(),
    });
    if (row.status === "active") {
      for (let i = 0; i < 3; i += 1) {
        const orderId = `${row.id}-order-${i}`;
        const saleAmountCents = 4999;
        const commissionAmountCents = Math.floor((saleAmountCents * row.commissionRateBps) / 10000);
        await db.collection("affiliateConversions").doc(orderId).set({
          affiliateId: row.id,
          orderId,
          saleAmountCents,
          commissionAmountCents,
          currency: "USD",
          couponCode: row.couponCode,
          status: i === 0 ? "paid" : "pending",
          eventType: "seed",
          orderAt: new Date(Date.now() - i * 86400000 * 4).toISOString(),
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      await db.collection("affiliateTickets").add({
        affiliateId: row.id,
        affiliateName: row.displayName,
        affiliateEmail: row.email,
        subject: "Payout timing",
        message: "When are monthly payouts sent?",
        status: "open",
        adminReply: "",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
  console.log("Seeded affiliates:", seeds.map((s) => s.couponCode).join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
