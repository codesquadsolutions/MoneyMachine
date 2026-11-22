# Flipur API (Postgres on VPS)

Express API for affiliates, checkout helpers, CRM, waitlist, and Dodo webhooks.  
**Production data store is Postgres.** Cloud Functions are not required.

Full VPS runbook (pm2, Traefik, ports): [../docs/VPS_API.md](../docs/VPS_API.md)  
Architecture: [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

## Requirements

- Node 20+
- Postgres (`DATABASE_URL`)

## Setup (local)

```bash
cd api
cp .env.example .env
# set DATABASE_URL, ADMIN_PASSWORD, JWT_SECRET
npm install
npm run dev
```

On start, tables are created automatically (`migrate()`).

Health: http://localhost:8080/health

## Auth

- **Public:** `POST /api/affiliate/interest`, waitlist join, pricing GET, checkout POST
- **Affiliate:** email/password → JWT (`POST /api/affiliate/login`)
- **Admin:** `POST /api/affiliate-admin` with `{ action: "login", username, password }` → JWT
- **CRM ingest:** `POST /api/crm/ingest` with `x-crm-secret: $CRM_INGEST_SECRET`

## Important routes

| Path | Purpose |
|------|---------|
| `GET /health` | Liveness + db label |
| `POST /api/affiliate/checkout` | Dodo checkout session |
| `GET /api/affiliate/pricing` | Catalog |
| `POST /api/webhooks/dodo` | Signed Dodo webhooks (raw body) |
| `POST /api/affiliate-admin` | Admin affiliate/CRM actions |
| `POST /api/crm` | CRM admin |
| `POST /api/crm/ingest` | Chat / Meta lead upsert |

## VPS (Hostinger) — day-2 commands

Process name: **`flipur-api`** (pm2)  
Typical host port: **8082** (behind Traefik → https://api.flipur.trade)

```bash
pm2 show flipur-api
pm2 logs flipur-api --lines 100
pm2 restart flipur-api

# find API folder
cd "$(pm2 jlist | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const p=JSON.parse(d).find(x=>x.name==='flipur-api'); console.log((p&&p.pm2_env&&p.pm2_env.pm_cwd)||'')})")"

curl http://127.0.0.1:8082/health
curl https://api.flipur.trade/health

# optional seed
psql "$DATABASE_URL" -f scripts/seed-waitlist.sql
```

Redeploy code from Windows:

```powershell
scp -r D:\Sharath\MoneyMachine\api\* root@YOUR_VPS_IP:/var/www/flipur-api/
```

```bash
cd /var/www/flipur-api
npm ci --omit=dev
pm2 restart flipur-api
```

## Dodo

Webhook URL: `https://api.flipur.trade/api/webhooks/dodo`  
See [../docs/STEP3_WEBHOOK.md](../docs/STEP3_WEBHOOK.md).

Product ID defaults: `src/lib/dodoProducts.js` (override via env).

## Frontends

```env
VITE_API_BASE=https://api.flipur.trade
VITE_AFFILIATE_ADMIN_URL=https://api.flipur.trade/api/affiliate-admin
```

Local: `VITE_API_BASE=http://localhost:8080`.

## Firestore → Postgres (one-time)

```bash
npm run migrate:firestore
```

See `scripts/migrate-firestore-to-postgres.js`. Does not delete Firestore data.
