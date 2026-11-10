import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataFile = path.join(repoRoot, "data", "waitlist.json");
const exampleFile = path.join(repoRoot, "data", "waitlist.example.json");
const platforms = new Set(["topstepx", "tradingview", "both"]);
const adminEmail = "admin@flipur.trade";
const cliClientId = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const cliClientSecret = "j9iVZfS8kkCEFUPaAeJV0sAi";

function projectId() {
  try {
    const rc = JSON.parse(fs.readFileSync(path.join(repoRoot, ".firebaserc"), "utf8"));
    return rc.projects?.default || "money-machine-247";
  } catch {
    return "money-machine-247";
  }
}

function cliConfigPath() {
  const home = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
  const roaming = process.env.APPDATA ? path.join(process.env.APPDATA, "configstore", "firebase-tools.json") : "";
  if (fs.existsSync(home)) return home;
  if (roaming && fs.existsSync(roaming)) return roaming;
  return "";
}

async function ownerAccessToken() {
  const file = cliConfigPath();
  const stored = file ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  const refresh = stored?.tokens?.refresh_token;
  if (!refresh) {
    const error = new Error("Sign in with the Firebase CLI to delete Authentication accounts.");
    error.status = 503;
    throw error;
  }
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cliClientId,
      client_secret: cliClientSecret,
      refresh_token: refresh,
      grant_type: "refresh_token",
    }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.access_token) {
    const error = new Error("Could not use the Firebase CLI login to delete that sign-in.");
    error.status = 503;
    throw error;
  }
  return json.access_token;
}

async function authQuery(token, expression) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId()}/accounts:query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expression: [expression], limit: "1" }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(json.error?.message || "Could not look up that sign-in.");
    error.status = response.status;
    throw error;
  }
  return json.userInfo?.[0] || null;
}

async function deleteAuthAccount(id, email) {
  const address = String(email || "").trim();
  if (address.toLowerCase() === adminEmail) {
    const error = new Error("The admin account can't be removed.");
    error.status = 400;
    throw error;
  }
  const token = await ownerAccessToken();
  let user = null;
  if (id) user = await authQuery(token, { userId: id });
  if (!user && address) user = await authQuery(token, { email: address });
  if (!user) return false;
  if (String(user.email || "").toLowerCase() === adminEmail) {
    const error = new Error("The admin account can't be removed.");
    error.status = 400;
    throw error;
  }
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId()}/accounts:delete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ localId: user.localId }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(json.error?.message || "Could not delete that sign-in.");
    error.status = response.status;
    throw error;
  }
  return true;
}

async function firebaseAdminRequest(req, apiKey) {
  const header = String(req.headers.authorization || "");
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!idToken || !apiKey) return false;
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const json = await response.json().catch(() => ({}));
  return String(json.users?.[0]?.email || "").toLowerCase() === adminEmail;
}

function readList() {
  const file = fs.existsSync(dataFile) ? dataFile : exampleFile;
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function sameEmail(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

function publicPeople() {
  return readList().map((person) => ({
    id: person.id,
    name: person.name || person.displayName || "",
    email: person.email || "",
    platform: person.platform || "",
    status: person.status === "invited" ? "invited" : "waiting",
    createdAt: person.createdAt || "",
  }));
}

function writeList(people) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, `${JSON.stringify(people, null, 2)}\n`);
}

function same(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

const sessionSeconds = 60 * 60 * 24 * 14;

function waitlistPlugin(env) {
  const user = env.ADMIN_USER || "admin";
  const password = env.ADMIN_PASSWORD || "";

  function tokenFrom(req) {
    const match = String(req.headers.cookie || "").match(/(?:^|;\s*)admin_session=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function signSession() {
    const body = Buffer.from(JSON.stringify({ u: user, exp: Date.now() + sessionSeconds * 1000 })).toString("base64url");
    const sig = crypto.createHmac("sha256", password).update(body).digest("base64url");
    return `${body}.${sig}`;
  }

  function sessionValid(token) {
    const [body, sig] = String(token).split(".");
    if (!body || !sig || !password) return false;
    const expected = crypto.createHmac("sha256", password).update(body).digest("base64url");
    if (!same(sig, expected)) return false;
    try {
      const payload = JSON.parse(Buffer.from(body, "base64url").toString());
      return payload.u === user && payload.exp > Date.now();
    } catch {
      return false;
    }
  }

  return {
    name: "waitlist-api",
    resolveId(id) {
      if (id === "virtual:waitlist") return "\0virtual:waitlist";
    },
    load(id) {
      if (id === "\0virtual:waitlist") return `export default ${JSON.stringify(readList())}`;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url || "").split("?")[0];
        if (!pathname.startsWith("/api/")) return next();

        const send = (code, body) => {
          res.statusCode = code;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };
        const readBody = () =>
          new Promise((resolve) => {
            const chunks = [];
            req.on("data", (chunk) => chunks.push(chunk));
            req.on("end", () => {
              try {
                resolve(JSON.parse(Buffer.concat(chunks).toString() || "{}"));
              } catch {
                resolve(null);
              }
            });
          });

        if (req.method === "GET" && pathname === "/api/health") return send(200, { ok: true });

        if (req.method === "POST" && pathname === "/api/login") {
          const body = await readBody();
          if (!password || !body || !same(body.username || "", user) || !same(body.password || "", password)) {
            return send(401, { error: "Wrong username or password." });
          }
          res.setHeader(
            "Set-Cookie",
            `admin_session=${signSession()}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${sessionSeconds}`,
          );
          return send(200, { ok: true });
        }

        if (req.method === "POST" && pathname === "/api/logout") {
          res.setHeader("Set-Cookie", "admin_session=; HttpOnly; Path=/; Max-Age=0");
          return send(200, { ok: true });
        }

        if (req.method === "POST" && pathname === "/api/waitlist/remove-account") {
          const allowed = sessionValid(tokenFrom(req)) || (await firebaseAdminRequest(req, env.VITE_FIREBASE_API_KEY));
          if (!allowed) return send(401, { error: "Sign in required." });
          const body = await readBody();
          const id = String(body?.id || "");
          if (!id || id.includes("/")) return send(400, { error: "Missing person." });
          try {
            const deletedAuth = await deleteAuthAccount(id, body?.email);
            return send(200, { deletedAuth });
          } catch (err) {
            return send(err.status || 500, { error: err.message || "Could not delete that sign-in." });
          }
        }

        if (!sessionValid(tokenFrom(req))) return send(401, { error: "Sign in required." });

        if (req.method === "GET" && pathname === "/api/waitlist") return send(200, { people: publicPeople() });

        if (req.method === "POST" && pathname === "/api/waitlist/invite") {
          const body = await readBody();
          const ids = new Set((Array.isArray(body?.ids) ? body.ids : []).map((id) => String(id || "")).filter(Boolean));
          if (!ids.size) return send(400, { error: "Choose someone to invite." });
          const people = readList();
          let found = false;
          for (const person of people) {
            if (ids.has(person.id)) {
              person.status = "invited";
              found = true;
            }
          }
          if (!found) return send(404, { error: "That person is not on the list." });
          writeList(people);
          return send(200, { people: publicPeople() });
        }

        if (req.method === "POST" && pathname === "/api/waitlist") {
          const body = await readBody();
          const name = String(body?.name || "").trim();
          const email = String(body?.email || "").trim();
          const platform = platforms.has(body?.platform) ? body.platform : "";
          if (!name || !email) return send(400, { error: "Name and email are required." });
          if (!platform) return send(400, { error: "Choose a platform." });
          const people = readList();
          if (people.some((person) => sameEmail(person.email, email))) {
            return send(409, { error: "That email is already on the waitlist." });
          }
          people.unshift({
            id: crypto.randomUUID(),
            name,
            email,
            platform,
            status: "waiting",
            createdAt: new Date().toISOString(),
          });
          writeList(people);
          return send(200, { people: publicPeople() });
        }

        if (req.method === "PATCH" && pathname.startsWith("/api/waitlist/")) {
          const id = decodeURIComponent(pathname.slice("/api/waitlist/".length));
          const body = await readBody();
          const platform = platforms.has(body?.platform) ? body.platform : "";
          if (!platform) return send(400, { error: "Choose a platform." });
          const people = readList();
          const person = people.find((item) => item.id === id);
          if (!person) return send(404, { error: "That person is not on the list." });
          person.platform = platform;
          writeList(people);
          return send(200, { people: publicPeople() });
        }

        if (req.method === "DELETE" && pathname.startsWith("/api/waitlist/")) {
          const id = decodeURIComponent(pathname.slice("/api/waitlist/".length));
          const people = readList().filter((person) => person.id !== id);
          writeList(people);
          return send(200, { people: publicPeople() });
        }

        return send(404, { error: "Not found." });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), waitlistPlugin(env)],
    server: { port: 5174, fs: { allow: [repoRoot] } },
  };
});
