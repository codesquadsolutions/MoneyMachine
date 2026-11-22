# Admin app login

Admin hosting: **https://money-machine-247-admin.web.app** (optional custom domain `admin.flipur.trade`).  
Firebase project: **`money-machine-247`**.

CRM data (waitlist, leads, affiliates) is served by the **VPS Postgres API** (`VITE_API_BASE`), not Cloud Functions.

There are two login layers:

1. **Firebase Email/Password** — gates the admin SPA when Firebase web config is present (`admin@flipur.trade`).
2. **API admin JWT** — used for affiliate master / CRM actions via `POST /api/affiliate-admin` (`ADMIN_USER` / `ADMIN_PASSWORD` on the VPS).

---

## One-time Firebase Console (~5 min)

1. [Authentication](https://console.firebase.google.com/project/money-machine-247/authentication) → enable **Email/Password**.

2. **Users** → **Add user**:
   - Email: `admin@flipur.trade`
   - Password: strong password stored only in your password manager (not in git)

3. [Authorized domains](https://console.firebase.google.com/project/money-machine-247/authentication/settings):
   - `money-machine-247-admin.web.app`
   - `money-machine-247.firebaseapp.com`
   - `admin.flipur.trade` (if used)
   - `localhost` (for `npm run dev:admin`)

---

## API admin password (VPS)

On the server `api/.env`:

```env
ADMIN_USER=admin
ADMIN_PASSWORD=CHANGE_ME_STRONG
JWT_SECRET=long-random-secret
```

```bash
pm2 restart flipur-api
```

Admin SPA should call:

```env
VITE_API_BASE=https://api.flipur.trade
VITE_AFFILIATE_ADMIN_URL=https://api.flipur.trade/api/affiliate-admin
```

**Do not** put real passwords in `VITE_ADMIN_PASSWORD` for production builds — Vite embeds `VITE_*` into the browser bundle. Prefer signing in through the UI / API login flow.

---

## Deploy admin hosting

```bash
# apps/admin/.env.production — Firebase web config + VITE_API_BASE (no secrets)
npm run deploy:admin
```

Local:

```bash
npm run dev:api
npm run dev:admin
```

---

## After login

| Route | Purpose |
|-------|---------|
| `/` | Decision / CRM dashboard |
| `/leads`, `/funnel`, `/campaigns` | CRM |
| `/waitlist` | Waitlist |
| `/affiliate-master` | Affiliates, onboard, payouts |

---

## Errors

| Message | Fix |
|---------|-----|
| `configuration-not-found` / `operation-not-allowed` | Enable Email/Password |
| Wrong password | Reset `admin@flipur.trade` in Firebase Users **or** API `ADMIN_PASSWORD` |
| Unauthorized domain | Add admin host to Authorized domains |
| Affiliate/CRM API 401 | Check VPS `ADMIN_PASSWORD`, `JWT_SECRET`, and `VITE_API_BASE` |
| CORS errors | Add admin origin to API `ALLOWED_ORIGINS` |
