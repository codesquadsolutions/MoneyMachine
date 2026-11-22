# Flipur API (Postgres on VPS)

Express API for affiliates, checkout helpers, and Dodo webhooks. **No Firebase Admin / service account.**

## Requirements

- Node 20+
- Postgres (`DATABASE_URL`)

## Setup

```bash
cd api
cp .env.example .env
# set DATABASE_URL, ADMIN_PASSWORD, JWT_SECRET
npm install
npm run dev
```

On start, tables are created automatically (`migrate()`).

## Auth

- **Public:** `POST /api/affiliate/interest`
- **Affiliate:** email/password → JWT (`POST /api/affiliate/login`)
- **Admin:** `POST /api/affiliate-admin` with `{ action: "login", username, password }` → JWT

## VPS (Hostinger)

Process name: **`flipur-api`** (pm2)  
Backend: **Postgres + this Express API** (not Firebase Functions)

```bash
# find API folder
pm2 show flipur-api

cd "$(pm2 jlist | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const p=JSON.parse(d).find(x=>x.name==='flipur-api'); console.log((p&&p.pm2_env&&p.pm2_env.pm_cwd)||'')})")"

# seed the 4 waitlist rows (once)
psql "$DATABASE_URL" -f scripts/seed-waitlist.sql
# or: npm run migrate && psql "$DATABASE_URL" -f scripts/seed-waitlist.sql

pm2 restart flipur-api
```

Frontends: `VITE_API_BASE=https://api.flipur.trade`
