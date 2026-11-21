import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const adminUser = "admin";
const sessionMs = 1000 * 60 * 60 * 24 * 14;

function secret() {
  return String(process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "dev-secret-change-me");
}

function same(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function signPayload(payload) {
  const body = b64url(payload);
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyToken(token) {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (!same(sig, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!payload?.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function signAdminToken() {
  return signPayload({ role: "admin", u: adminUser, exp: Date.now() + sessionMs });
}

export function signAffiliateToken(affiliate) {
  return signPayload({
    role: "affiliate",
    sub: affiliate.id,
    email: affiliate.email,
    exp: Date.now() + sessionMs,
  });
}

export function readBearer(req) {
  const header = String(req.get("authorization") || "");
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export function verifyAdminPassword(username, password) {
  const expectedUser = String(process.env.ADMIN_USER || adminUser);
  const expectedPass = String(process.env.ADMIN_PASSWORD || "");
  if (!expectedPass) return false;
  return same(username || "", expectedUser) && same(password || "", expectedPass);
}

export function requireAdmin(req) {
  const payload = verifyToken(readBearer(req));
  if (payload?.role === "admin") return payload;
  return null;
}

export function requireAffiliate(req) {
  const payload = verifyToken(readBearer(req));
  if (payload?.role === "affiliate" && payload.sub) return payload;
  return null;
}

export async function hashPassword(password) {
  return bcrypt.hash(String(password), 10);
}

export async function checkPassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(String(password), String(hash));
}

export function randomPassword(length = 12) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

export { verifyToken, adminUser };
