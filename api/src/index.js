import "dotenv/config";
import express from "express";
import cors from "cors";
import { migrate } from "./db.js";
import { handleAffiliateAdmin } from "./lib/affiliateAdminService.js";
import { handleCrmIngest } from "./lib/crmIngest.js";
import { handleCrmAdmin, handleWaitlistJoin, handleWaitlistStatus } from "./lib/crmService.js";
import affiliateRoutes from "./routes/affiliate.js";
import webhookRoutes from "./routes/webhook.js";
import { sendError } from "./lib/httpError.js";

const app = express();
const port = Number(process.env.PORT || 8080);

const allowedOrigins = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://flipur.trade",
  "https://www.flipur.trade",
  "https://admin.flipur.trade",
  "https://money-machine-247.web.app",
  "https://money-machine-247-admin.web.app",
];

const origins = allowedOrigins.length ? allowedOrigins : defaultOrigins;

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || origins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "flipur-api", db: "postgres" });
});

app.use("/api/webhooks", express.raw({ type: "*/*" }), webhookRoutes);
app.use(express.json({ limit: "1mb" }));
app.use("/api/affiliate", affiliateRoutes);
app.post("/api/affiliate-admin", handleAffiliateAdmin);
app.post("/affiliateAdmin", handleAffiliateAdmin);
app.post("/api/crm", handleCrmAdmin);
app.post("/api/crm/ingest", handleCrmIngest);
app.post("/api/waitlist/join", handleWaitlistJoin);
app.post("/api/waitlist/status", handleWaitlistStatus);

app.use((err, _req, res, _next) => {
  console.error(err);
  sendError(res, err);
});

async function start() {
  await migrate();
  app.listen(port, () => {
    console.log(`[flipur-api] listening on http://localhost:${port} (postgres)`);
  });
}

start().catch((err) => {
  console.error("[flipur-api] failed to start:", err.message || err);
  process.exit(1);
});
