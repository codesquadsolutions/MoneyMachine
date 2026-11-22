# Flipur (MoneyMachine)

Marketing site, admin CRM/affiliates, and VPS API for **Flipur** — Chrome extension that flips order side/type before submit. The extension itself lives in a separate repo.

**Live:** https://flipur.trade · **API:** https://api.flipur.trade/health

## Architecture (short)

| Piece | Where |
|-------|--------|
| `apps/web` | Public site → Firebase Hosting (`money-machine-247`) |
| `apps/admin` | CRM + affiliates → Firebase Hosting admin target |
| `api` | Express + **Postgres** on VPS (`pm2` → `flipur-api`, Traefik → `api.flipur.trade`) |
| `functions/` | Legacy Cloud Functions — **not** used for go-live |

Full diagram and URL map: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Local development

```bash
npm run dev:api    # http://localhost:8080
npm run dev:web    # http://localhost:5173
npm run dev:admin  # http://localhost:5174
```

Copy `api/.env.example` → `api/.env` (Postgres `DATABASE_URL`).  
Set `VITE_API_BASE=http://localhost:8080` in web/admin env files.

## Deploy

```bash
npm run deploy:web
npm run deploy:admin
# API: see docs/VPS_API.md (scp + pm2 restart flipur-api)
```

## Docs index

| Doc | Topic |
|-----|--------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Current stack |
| [docs/VPS_API.md](./docs/VPS_API.md) | VPS Postgres, pm2, Traefik, redeploy |
| [docs/GO_LIVE_READINESS.md](./docs/GO_LIVE_READINESS.md) | Launch scorecard |
| [docs/PRODUCTION_GO_LIVE.md](./docs/PRODUCTION_GO_LIVE.md) | Live checklist |
| [docs/LAUNCH_TRACK_A_AND_SANDBOX_B.md](./docs/LAUNCH_TRACK_A_AND_SANDBOX_B.md) | Marketing + test_mode funnel |
| [docs/STEP3_WEBHOOK.md](./docs/STEP3_WEBHOOK.md) | Dodo → Express webhook |
| [docs/PRICING_SETUP.md](./docs/PRICING_SETUP.md) | Product IDs + pricing page |
| [AFFILIATE_SETUP.md](./AFFILIATE_SETUP.md) | Affiliates |
| [docs/ADMIN_LOGIN_SETUP.md](./docs/ADMIN_LOGIN_SETUP.md) | Admin login |
| [docs/DOMAIN_CONNECT_FLIPUR_TRADE.md](./docs/DOMAIN_CONNECT_FLIPUR_TRADE.md) | DNS / domains |
| [docs/LOCAL_SUPPORT_CHAT.md](./docs/LOCAL_SUPPORT_CHAT.md) | n8n support widget |
| [docs/flipur-n8n-knowledge-base.md](./docs/flipur-n8n-knowledge-base.md) | Support agent KB |
| [api/README.md](./api/README.md) | API local setup |

Support: makemoney@flipur.trade
