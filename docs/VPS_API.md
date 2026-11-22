# Flipur API on VPS (Docker Compose + Postgres + Traefik)

Hostinger Ubuntu `srv1178699`. Flipur runs as a **Docker Compose** service. pm2 on this box is for **other** apps (`nelaa-api`, `stcs-api`) — do not use it for Flipur. **Do not reuse other projects’ DBs or ports.**

Canonical public URL: **https://api.flipur.trade**

Also see [ARCHITECTURE.md](./ARCHITECTURE.md) and [../api/README.md](../api/README.md). Daily commands are also in the repo [README](../README.md).

---

## Production facts (as deployed)

| Item | Value |
|------|--------|
| App folder | `/var/www/flipur` (git clone; API is `api/`) |
| Process | Docker **`flipur-api`** in `/root/docker-compose.yml` (project `root`) |
| Container | `root-flipur-api-1` (`node:20`) |
| Host listen port | **32780** → container **8082** |
| Postgres | DB `flipur`, role `flipur`, host `5432` |
| Public routing | Traefik (`root-traefik-1`) → `Host(api.flipur.trade)` |
| Health | `curl https://api.flipur.trade/health` or `curl http://127.0.0.1:32780/health` |

---

## 0) Inspect VPS before changing anything

```bash
whoami
hostname
uname -a

sudo ss -tulpn | head -50

node -v && npm -v && pm2 -v
pm2 list

ls -la /etc/nginx/sites-enabled/ 2>/dev/null
ls -la /var/www/
docker ps
docker compose ls 2>/dev/null

sudo systemctl status postgresql --no-pager
sudo -u postgres psql -c "\l"
sudo -u postgres psql -c "\du"

df -h
free -h
```

Paste especially: `pm2 list`, Postgres `\l`, and listening ports — then pick a free port (we used **8082**).

---

## 1) Create Postgres user + database (once)

```bash
sudo -u postgres psql <<'SQL'
CREATE USER flipur WITH PASSWORD 'PICK_A_STRONG_PASSWORD';
CREATE DATABASE flipur OWNER flipur;
GRANT ALL PRIVILEGES ON DATABASE flipur TO flipur;
\c flipur
GRANT ALL ON SCHEMA public TO flipur;
SQL
```

Verify:

```bash
sudo -u postgres psql -c "\l" | grep flipur
sudo -u postgres psql -c "\du" | grep flipur
```

Connection string:

```text
postgres://flipur:PICK_A_STRONG_PASSWORD@127.0.0.1:5432/flipur
```

---

## 2) App folder + upload code

On VPS:

```bash
mkdir -p /var/www/flipur-api
cd /var/www/flipur-api
```

From **Windows PowerShell** (PC):

```powershell
scp -r D:\Sharath\MoneyMachine\api\* root@YOUR_VPS_IP:/var/www/flipur-api/
```

Or if the git repo is already on the VPS:

```bash
cp -r /path/to/MoneyMachine/api/. /var/www/flipur-api/
cd /var/www/flipur-api
```

Confirm:

```bash
ls -la /var/www/flipur-api
ls -la /var/www/flipur-api/src
```

You should see `package.json`, `src/`, `.env.example`.

---

## 3) Env + install

```bash
cd /var/www/flipur-api
cp .env.example .env
nano .env
```

Minimum production env:

```env
PORT=8082
DATABASE_URL=postgres://flipur:PICK_A_STRONG_PASSWORD@127.0.0.1:5432/flipur
ADMIN_USER=admin
ADMIN_PASSWORD=CHANGE_ME_STRONG
JWT_SECRET=long-random-secret
CRM_INGEST_SECRET=CHANGE_ME_INGEST
FLIPUR_SITE_ORIGIN=https://flipur.trade
ALLOWED_ORIGINS=https://flipur.trade,https://www.flipur.trade,https://admin.flipur.trade,https://money-machine-247.web.app,https://money-machine-247-admin.web.app,http://localhost:5173,http://localhost:5174

# Dodo (test_mode until live keys are ready)
DODO_PAYMENTS_ENVIRONMENT=live_mode
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_WEBHOOK_KEY=
DODO_FLIPUR_PRODUCT_ID_MONTHLY=
DODO_FLIPUR_PRODUCT_ID_YEARLY=
```

Install:

```bash
cd /var/www/flipur-api
npm ci --omit=dev
# or: npm install --omit=dev
```

Tables are created automatically on process start (`migrate()`). Optional one-shot:

```bash
npm run migrate
# optional seed:
psql "$DATABASE_URL" -f scripts/seed-waitlist.sql
```

Firestore → Postgres (one-time, from a machine with credentials):

```bash
# from repo, with DATABASE_URL pointing at VPS (tunnel or direct) + Firebase creds
npm run migrate:firestore
```

See `api/scripts/migrate-firestore-to-postgres.js`.

---

## 4) Run with pm2

Foreground smoke test (optional):

```bash
cd /var/www/flipur-api
node src/index.js
# expect: listening on http://localhost:8082 (postgres)
```

Second SSH session:

```bash
curl http://127.0.0.1:8082/health
# {"ok":true,"service":"flipur-api","db":"postgres"}
```

Then stop foreground (`Ctrl+C`) and:

```bash
cd /var/www/flipur-api
pm2 start src/index.js --name flipur-api
pm2 save
pm2 status
curl http://127.0.0.1:8082/health
```

### Day-2 ops

```bash
pm2 show flipur-api
pm2 logs flipur-api --lines 100
pm2 restart flipur-api

# find cwd if unsure
pm2 jlist | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const p=JSON.parse(d).find(x=>x.name==='flipur-api'); console.log((p&&p.pm2_env&&p.pm2_env.pm_cwd)||'')})"
```

### Redeploy API code (every time)

```bash
# on VPS
cd /var/www/flipur
git pull

cd /root
docker compose restart flipur-api
docker compose logs --tail=80 flipur-api

curl -sS http://127.0.0.1:32780/health
curl -sS https://api.flipur.trade/health
```

From Windows instead of `git pull`:

```powershell
scp -r D:\Sharath\MoneyMachine\api\* root@31.97.207.229:/var/www/flipur/api/
```

If `package.json` changed:

```bash
cd /root
docker compose up -d --force-recreate flipur-api
```

Always pass the service name **`flipur-api`**. Do not run a bare `docker compose up`.

---

## 5) Public HTTPS via Traefik (production path on this VPS)

Traefik owns **80/443**. Flipur API runs on the **host** (pm2 :8082), so add a small nginx proxy container with Traefik labels (same pattern as other host APIs).

### DNS

```bash
dig +short api.flipur.trade
```

Must return the VPS IP. If empty, add A record `api` → VPS IP at the registrar (Hostinger).

### Proxy config

```bash
mkdir -p /root/flipur-traefik
cat > /root/flipur-traefik/nginx.conf <<'EOF'
server {
    listen 80;
    location / {
        proxy_pass http://host.docker.internal:8082;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

### Compose override (does not rewrite the whole stack)

```bash
cp /root/docker-compose.yml /root/docker-compose.yml.bak-flipur-$(date +%Y%m%d)
cat > /root/docker-compose.flipur.yml <<'EOF'
services:
  flipur-api:
    image: nginx:alpine
    container_name: flipur-api-proxy
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - /root/flipur-traefik/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    labels:
      - traefik.enable=true
      - traefik.http.routers.flipur-api.rule=Host(`api.flipur.trade`)
      - traefik.http.routers.flipur-api.entrypoints=web,websecure
      - traefik.http.routers.flipur-api.tls=true
      - traefik.http.routers.flipur-api.tls.certresolver=mytlschallenge
      - traefik.http.services.flipur-api.loadbalancer.server.port=80
EOF
```

Start only this service:

```bash
cd /root
docker compose -f docker-compose.yml -f docker-compose.flipur.yml up -d flipur-api
docker ps | grep flipur
curl http://127.0.0.1:8082/health
```

Public test:

```bash
curl -I https://api.flipur.trade/health
curl https://api.flipur.trade/health
```

---

## 6) Alternate: host nginx (if Traefik is not used)

Only if nothing else owns 80/443 on the host:

```nginx
# /etc/nginx/sites-available/flipur-api
server {
    listen 80;
    server_name api.flipur.trade;

    location / {
        proxy_pass http://127.0.0.1:8082;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/flipur-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.flipur.trade
```

On **this** VPS, prefer the Traefik path above.

---

## 7) Point frontends at the API

Build-time env (already set in production files):

```env
# apps/web/.env.production
VITE_API_BASE=https://api.flipur.trade

# apps/admin/.env.production
VITE_API_BASE=https://api.flipur.trade
VITE_AFFILIATE_ADMIN_URL=https://api.flipur.trade/api/affiliate-admin
```

**Do not** commit real `VITE_ADMIN_PASSWORD` — Vite embeds `VITE_*` into the client bundle. Prefer interactive login + API `ADMIN_PASSWORD` only on the server.

Redeploy hosting after env changes:

```bash
npm run deploy:web
npm run deploy:admin
```

---

## 8) Dodo webhook (must hit Express, not Cloud Functions)

In Dodo (test or live mode matching `DODO_PAYMENTS_ENVIRONMENT`):

**Endpoint:** `https://api.flipur.trade/api/webhooks/dodo`

Events: `payment.succeeded`, `subscription.active`, `subscription.renewed`, `refund.succeeded`

Signing secret → `DODO_PAYMENTS_WEBHOOK_KEY` in VPS `api/.env`, then `pm2 restart flipur-api`.

Details: [STEP3_WEBHOOK.md](./STEP3_WEBHOOK.md).

---

## Port tip

If 8082 is taken later, set `PORT=…` in `.env`, update Traefik proxy `proxy_pass` / nginx, restart pm2 + proxy container.


nano /root/docker-compose.yml

nano /var/www/flipur/api/.env

cd /root && docker compose restart flipur-api