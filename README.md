# Flipur (MoneyMachine)

Marketing site, admin CRM/affiliates, and VPS API for **Flipur** — Chrome extension that flips order side/type before submit. The extension itself lives in a separate repo.

**Live:** https://flipur.trade · **API:** https://api.flipur.trade/health

## Architecture (short)

| Piece | Where |
|-------|--------|
| `apps/web` | Public site → Firebase Hosting (`money-machine-247`) |
| `apps/admin` | CRM + affiliates → Firebase Hosting admin target |
| `api` | Express + **Postgres** on VPS (**Docker** `flipur-api` + Traefik → `api.flipur.trade`) |
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

### Site + admin (Firebase, from your PC)

```bash
npm run deploy:web
npm run deploy:admin
```

### API on VPS (Docker — not pm2)

Hostinger box `srv1178699`. Flipur API is a Compose service in `/root/docker-compose.yml`. Code lives at `/var/www/flipur`. pm2 on this VPS is for **other** apps (`nelaa-api`, `stcs-api`) — do not use it for Flipur.

| Item | Value |
|------|--------|
| Code | `/var/www/flipur` (repo clone; backend is `api/`) |
| Container | `root-flipur-api-1` (`node:20`) |
| Compose | `/root/docker-compose.yml` · project `root` · service **`flipur-api`** |
| Host port | **32780** → container **8082** |
| Public | Traefik (`root-traefik-1`) → https://api.flipur.trade |
| Postgres | Host Postgres, DB `flipur`, user `flipur` |

Local `8082` / `8080` on the host will fail. Health-check **32780** or the public URL.

#### Redeploy API (every time)

On the VPS:

```bash
cd /var/www/flipur
git pull

cd /root
docker compose restart flipur-api
docker compose logs --tail=80 flipur-api

curl -sS http://127.0.0.1:32780/health
curl -sS https://api.flipur.trade/health
```

If you copy files from Windows instead of `git pull`:

```powershell
scp -r D:\Sharath\MoneyMachine\api\* root@31.97.207.229:/var/www/flipur/api/
```

Then on the VPS: `cd /root && docker compose restart flipur-api`.

If `package.json` / lockfile changed (new npm deps):

```bash
cd /root
docker compose up -d --force-recreate flipur-api
```

Always name **`flipur-api`**. Do not run a bare `docker compose up` — that file also runs Traefik and other projects.

More detail: [docs/VPS_API.md](./docs/VPS_API.md).

## Docs index

| Doc | Topic |
|-----|--------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Current stack |
| [docs/VPS_API.md](./docs/VPS_API.md) | VPS Postgres, Docker Compose, Traefik, redeploy |
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
