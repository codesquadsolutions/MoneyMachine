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

## VPS

1. Create DB/user on your Postgres server  
2. Deploy `api/`, set `.env` with `DATABASE_URL`  
3. `npm ci --omit=dev && pm2 start src/index.js --name flipur-api`  
4. Nginx → `http://127.0.0.1:8080`  
5. Frontends: `VITE_API_BASE=https://api.yourdomain.com`
