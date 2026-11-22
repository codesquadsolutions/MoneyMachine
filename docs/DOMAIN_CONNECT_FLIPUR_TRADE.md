# Connect flipur.trade + api.flipur.trade

Code and SEO assume **https://flipur.trade**. Firebase Hosting project: **`money-machine-247`**.

> **SSL errors in incognito / mobile?** See **[FIX_FLIPUR_SSL_INCognito.md](./FIX_FLIPUR_SSL_INCognito.md)** — usually a **wrong AAAA record** (Hostinger IPv6) while **A** points to Firebase.

## Current URL map

| What | URL |
|------|-----|
| Public site | https://flipur.trade |
| Hosting fallback | https://money-machine-247.web.app |
| Admin | https://money-machine-247-admin.web.app or **admin.flipur.trade** |
| API | https://api.flipur.trade |
| Dodo webhook | `https://api.flipur.trade/api/webhooks/dodo` |

---

## Phase 1 — Firebase Hosting custom domain (web)

1. Open [Firebase Hosting](https://console.firebase.google.com/project/money-machine-247/hosting) → site for target **web**.
2. **Add custom domain** → `flipur.trade`.
3. If offered, also add `www.flipur.trade` → redirect to apex.
4. Copy the **TXT** / **A** records Firebase shows.
5. At **Hostinger** (registrar), paste those DNS records.
6. Wait until Firebase shows **Connected**.

**IPv6:** delete Hostinger AAAA on `@` unless Firebase gave you an AAAA to use — see SSL fix doc.

Optional admin subdomain:

1. Hosting site for target **admin** → Add custom domain → `admin.flipur.trade`
2. Add DNS at registrar.

---

## Phase 2 — API subdomain (`api.flipur.trade`)

1. DNS **A** record: `api` → **VPS IP** (not Firebase).
2. Confirm:

   ```bash
   dig +short api.flipur.trade
   ```

3. Traefik + pm2 setup: [VPS_API.md](./VPS_API.md).
4. Verify:

   ```bash
   curl https://api.flipur.trade/health
   ```

---

## Phase 3 — Firebase Auth authorized domains

1. [Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/money-machine-247/authentication/settings)
2. Add: `flipur.trade`, `www.flipur.trade`, admin host if used.
3. Keep `money-machine-247.web.app` / `localhost` for staging/dev.

---

## Phase 4 — Checkout return URL

On VPS `api/.env`:

```env
FLIPUR_SITE_ORIGIN=https://flipur.trade
```

```bash
pm2 restart flipur-api
```

Dodo return / success page should be:

`https://flipur.trade/checkout/success`

Frontends must be built with `VITE_API_BASE=https://api.flipur.trade`.

---

## Phase 5 — Smoke test

On **https://flipur.trade**:

| # | Check |
|---|--------|
| 1 | Home, `/pricing`, `/faq` load with SSL |
| 2 | Pricing → checkout → pay (test or small live) |
| 3 | Land on **https://flipur.trade/checkout/success** |
| 4 | Webhook 200 on `api.flipur.trade` |
| 5 | Support chat bubble works |

---

## DNS checklist (Hostinger)

| Record | Host | Points to |
|--------|------|-----------|
| A | `@` | Firebase Hosting IPs (from Console) |
| A / CNAME | `www` | per Firebase |
| A | `api` | **VPS IP** |
| A / CNAME | `admin` | Firebase admin site (optional) |
| AAAA `@` | — | **Remove** if it points at Hostinger, not Firebase |

Legacy project `flipur-404bd` is no longer the default in `.firebaserc`.
