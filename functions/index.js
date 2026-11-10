import crypto from "node:crypto";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

initializeApp();

const adminPassword = defineSecret("ADMIN_PASSWORD");
const adminUser = "admin";
const adminEmail = "admin@flipur.trade";
const sessionMs = 1000 * 60 * 60 * 24 * 14;
const platforms = new Set(["topstepx", "tradingview", "both"]);

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

function iso(value) {
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return "";
}

function cleanId(id) {
  const value = String(id || "");
  if (!value || value.includes("/")) return "";
  return value;
}

function sameEmail(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

async function findAuthUser(id, email) {
  const auth = getAuth();
  if (id) {
    try {
      return await auth.getUser(id);
    } catch (err) {
      if (err.code !== "auth/user-not-found") throw err;
    }
  }
  if (!email) return null;
  try {
    return await auth.getUserByEmail(email);
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    return null;
  }
}

async function removePerson(id) {
  const clean = cleanId(id);
  if (!clean) {
    const error = new Error("Missing person.");
    error.status = 400;
    throw error;
  }
  const ref = getFirestore().collection("waitlist").doc(clean);
  const snap = await ref.get();
  if (!snap.exists) {
    const error = new Error("That person is not on the list.");
    error.status = 404;
    throw error;
  }
  const email = String(snap.data()?.email || "").trim();
  if (email.toLowerCase() === adminEmail) {
    const error = new Error("The admin account can't be removed.");
    error.status = 400;
    throw error;
  }
  const account = await findAuthUser(clean, email);
  if (account) {
    if (String(account.email || "").toLowerCase() === adminEmail) {
      const error = new Error("The admin account can't be removed.");
      error.status = 400;
      throw error;
    }
    await getAuth().deleteUser(account.uid);
  }
  await ref.delete();
}

async function people() {
  const snap = await getFirestore().collection("waitlist").get();
  const rows = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.displayName || data.name || "",
      email: data.email || "",
      platform: data.platform || "",
      status: data.status === "invited" ? "invited" : "waiting",
      createdAt: iso(data.createdAt),
    };
  });
  rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return rows;
}

export const adminWaitlist = onRequest(
  {
    secrets: [adminPassword],
    cors: [
      "https://money-machine-247-admin.web.app",
      "https://money-machine-247-admin.firebaseapp.com",
      "https://admin.flipur.trade",
      "http://localhost:5174",
    ],
  },
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
      res.json({ token: sign(password), people: await people() });
      return;
    }

    if (!valid(bearer, password)) {
      res.status(401).json({ error: "Sign in required." });
      return;
    }

    if (action === "list") {
      res.json({ people: await people() });
      return;
    }

    if (action === "add") {
      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim();
      const platform = platforms.has(req.body?.platform) ? req.body.platform : "";
      if (!name || !email) {
        res.status(400).json({ error: "Name and email are required." });
        return;
      }
      if (!platform) {
        res.status(400).json({ error: "Choose a platform." });
        return;
      }
      const rows = await people();
      if (rows.some((person) => sameEmail(person.email, email))) {
        res.status(409).json({ error: "That email is already on the waitlist." });
        return;
      }
      await getFirestore().collection("waitlist").doc(crypto.randomUUID()).set({
        email,
        displayName: name,
        photoURL: "",
        platform,
        status: "waiting",
        createdAt: FieldValue.serverTimestamp(),
      });
      res.json({ people: await people() });
      return;
    }

    if (action === "update") {
      const id = cleanId(req.body?.id);
      const platform = platforms.has(req.body?.platform) ? req.body.platform : "";
      if (!id) {
        res.status(400).json({ error: "Missing person." });
        return;
      }
      if (!platform) {
        res.status(400).json({ error: "Choose a platform." });
        return;
      }
      const ref = getFirestore().collection("waitlist").doc(id);
      const snap = await ref.get();
      if (!snap.exists) {
        res.status(404).json({ error: "That person is not on the list." });
        return;
      }
      await ref.update({ platform });
      res.json({ people: await people() });
      return;
    }

    if (action === "invite") {
      const ids = [...new Set((Array.isArray(req.body?.ids) ? req.body.ids : []).map(cleanId).filter(Boolean))];
      if (!ids.length) {
        res.status(400).json({ error: "Choose someone to invite." });
        return;
      }
      const db = getFirestore();
      for (let index = 0; index < ids.length; index += 400) {
        const slice = ids.slice(index, index + 400);
        const refs = slice.map((id) => db.collection("waitlist").doc(id));
        const snaps = await db.getAll(...refs);
        if (snaps.some((snap) => !snap.exists)) {
          res.status(404).json({ error: "That person is not on the list." });
          return;
        }
        const batch = db.batch();
        for (const ref of refs) batch.update(ref, { status: "invited" });
        await batch.commit();
      }
      res.json({ people: await people() });
      return;
    }

    if (action === "remove") {
      try {
        await removePerson(req.body?.id);
      } catch (err) {
        res.status(err.status || 500).json({ error: err.message || "Could not remove that person." });
        return;
      }
      res.json({ people: await people() });
      return;
    }

    res.status(400).json({ error: "Unknown action." });
  },
);

export const removeWaitlistPerson = onCall({ region: "us-central1", invoker: "public", cors: true }, async (request) => {
  if (request.auth?.token?.email !== adminEmail) {
    throw new HttpsError("permission-denied", "Sign in required.");
  }
  try {
    await removePerson(request.data?.id);
  } catch (err) {
    if (err.status === 400) throw new HttpsError("invalid-argument", err.message);
    if (err.status === 404) throw new HttpsError("not-found", err.message);
    throw new HttpsError("internal", err.message || "Could not remove that person.");
  }
  return { ok: true };
});
