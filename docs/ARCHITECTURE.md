# Flipur architecture (current)

Last updated: November 2026 (post Cloud Functions → VPS Postgres migration).

## What Flipur is

Chrome extension marketing + monetization stack: site, admin CRM/affiliates, Express API, Dodo Payments. The **Chrome extension itself is a separate repo**.

## Live URLs

| Piece | URL |
|-------|-----|
| Public site | https://flipur.trade |
| Firebase Hosting (web) | https://money-machine-247.web.app |
| Admin | https://money-machine-247-admin.web.app (optional custom: `admin.flipur.trade`) |
| API | https://api.flipur.trade |
| API health | https://api.flipur.trade/health → `{"ok":true,"service":"flipur-api","db":"postgres"}` |
| Dodo webhook | `https://api.flipur.trade/api/webhooks/dodo` |
| Support chat | n8n webhook (see `SupportChat.jsx` / [flipur-n8n-knowledge-base.md](./flipur-n8n-knowledge-base.md)) |

## Stack

```
Browser
  ├─ apps/web     → Firebase Hosting (project money-machine-247)
  ├─ apps/admin   → Firebase Hosting admin target
  └─ both call    → VITE_API_BASE = https://api.flipur.trade

VPS (Hostinger srv1178699)
  ├─ Postgres DB `flipur` (user `flipur`) on the host
  ├─ Docker Compose `/root/docker-compose.yml` → service `flipur-api`
  │    container `root-flipur-api-1`, code `/var/www/flipur/api`
  │    host **32780** → container **8082**
  └─ Traefik (`root-traefik-1`) → Host(`api.flipur.trade`) + TLS
```

| Layer | Tech | Notes |
|-------|------|--------|
| Web / admin UI | Vite + React | Build-time `VITE_*` env |
| Hosting | Firebase Hosting | `.firebaserc` → **`money-machine-247`** |
| Auth (admin UI shell) | Firebase Email/Password `admin@flipur.trade` when Firebase config present | Affiliates use API JWT, not Firebase Auth |
| Auth (API) | Admin + affiliate JWT (`ADMIN_PASSWORD` / bcrypt) | See `api/src/authTokens.js` |
| Data | **Postgres on VPS** | Waitlist, CRM, affiliates, webhook dedup |
| Payments | Dodo Checkout Sessions + signed webhooks | Secrets in `api/.env` on VPS |
| Support | n8n Chat Trigger + `engine-sdk.js` | Not BotPenguin / not Render for production |

## Repo layout

| Path | Role |
|------|------|
| `apps/web` | Marketing site, pricing, affiliate portal |
| `apps/admin` | CRM + affiliate master |
| `api` | **Production backend** (Express + Postgres) |
| `functions/` | **Legacy** Cloud Functions — do **not** deploy for Flipur go-live |
| `docs/` | Ops + KB |
| `scripts/` | Local Dodo secret helpers (historical; live keys live on VPS `api/.env`) |

## Client → API map

Web (`apps/web/src/lib/callables.js`) and admin (`apps/admin/src/affiliateApi.js`) call the VPS API:

| Action | Method + path |
|--------|----------------|
| Affiliate interest | `POST /api/affiliate/interest` |
| Affiliate login / me / dashboard / ticket | under `/api/affiliate/*` |
| Checkout session | `POST /api/affiliate/checkout` |
| Pricing catalog | `GET /api/affiliate/pricing` |
| Affiliate admin | `POST /api/affiliate-admin` |
| CRM admin | `POST /api/crm` |
| CRM ingest (chat/Meta) | `POST /api/crm/ingest` (`x-crm-secret`) |
| Waitlist | `POST /api/waitlist/join`, `…/status` |
| Dodo webhook | `POST /api/webhooks/dodo` (raw body) |

## Related docs

- [VPS_API.md](./VPS_API.md) — deploy / restart / Traefik commands
- [PRODUCTION_GO_LIVE.md](./PRODUCTION_GO_LIVE.md) — golden path checklist
- [STEP3_WEBHOOK.md](./STEP3_WEBHOOK.md) — Dodo webhook verify
- [GO_LIVE_READINESS.md](./GO_LIVE_READINESS.md) — scorecard
- [../api/README.md](../api/README.md) — local API setup
