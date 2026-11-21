import { getAuth } from "../firebase.js";
import { adminEmail } from "../lib/constants.js";
import { httpError } from "../lib/httpError.js";

export async function optionalAuth(req, _res, next) {
  const header = String(req.get("authorization") || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = decoded;
  } catch {
    req.user = null;
  }
  return next();
}

export async function requireAuth(req, _res, next) {
  await optionalAuth(req, _res, () => {});
  if (!req.user?.uid) return next(httpError(401, "Sign in required.", "unauthenticated"));
  return next();
}

export async function requireAffiliateAdmin(req, _res, next) {
  await requireAuth(req, _res, (err) => {
    if (err) return next(err);
    const email = String(req.user?.email || "").toLowerCase();
    if (email !== adminEmail) return next(httpError(403, "Admin only.", "permission-denied"));
    return next();
  });
}
