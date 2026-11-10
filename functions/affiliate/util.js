import crypto from "node:crypto";

export function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

export function suggestCode(name) {
  const base = String(name || "AFF")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${base || "FLIP"}${suffix}`.slice(0, 16);
}

export function iso(value) {
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return "";
}

export function rangeBounds(range) {
  const now = new Date();
  const end = now.getTime();
  if (range === "wow") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { start: start.getTime(), end };
  }
  if (range === "mom") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    return { start: start.getTime(), end };
  }
  return { start: 0, end };
}

export function commissionFromSale(amountCents, rateBps) {
  const amount = Math.max(0, Math.floor(Number(amountCents) || 0));
  const bps = Math.max(0, Math.floor(Number(rateBps) || 0));
  return Math.floor((amount * bps) / 10000);
}
