# Fix flipur.trade SSL errors (incognito, mobile, intermittent)

## Symptom

- **Chrome:** `ERR_SSL_PROTOCOL_ERROR` — “This site can’t provide a secure connection”
- **Works sometimes** in normal browser, **fails in incognito** or **on phone**
- **`https://flipur.trade/pricing`** may work when you click a link, but typing **`flipur.trade`** fails

## Root cause (confirmed)

Your DNS has:

- **A** `@` → `199.36.158.100` → **Firebase** ✅ (IPv4 works)
- **AAAA** `@` → `2a02:4780:…` → **Hostinger**, not Firebase ❌

Many phones and networks use **IPv6 first**. They hit Hostinger’s IPv6 address, which does **not** serve Firebase’s HTTPS certificate → **SSL protocol error**.

Normal browser can “sometimes work” when it uses **IPv4** or cached connections.

**This is not a bug in the Flipur code.** Fix DNS at Hostinger.

---

## Fix (Hostinger — you, ~10 min)

### Step 1 — Open DNS

hPanel → **Domains** → **flipur.trade** → **DNS / Nameservers** → clear any search filter.

### Step 2 — Delete the wrong AAAA record

Delete the **AAAA** record on `@` with content like:

`2a02:4780:b:1044:0:3823:ca06:10`

(or any AAAA you added from Hostinger, not from Firebase)

**Do not delete:**

- **A** `199.36.158.100` (keep unless Firebase Console shows different A values)
- **TXT** `hosting-site=flipur-404bd`
- MX / SPF / DKIM (email)

### Step 3 — Add Firebase A/AAAA only (if Firebase shows them)

1. [Firebase Hosting → flipur-404bd → Domains → flipur.trade](https://console.firebase.google.com/project/flipur-404bd/hosting/sites/flipur-404bd)
2. Open domain setup / DNS instructions.
3. For each **A** and **AAAA** Firebase lists, ensure Hostinger matches exactly.
4. If Firebase lists **only A records** (no AAAA), leave **no AAAA** on `@` — that is OK.

### Step 4 — Turn off Hostinger CDN / website on this domain

- **Websites:** no live Hostinger site on `flipur.trade`
- **CDN:** disabled for this domain (Hostinger CDN + Firebase = SSL conflicts)

### Step 5 — Wait and test

- Wait **15–60 minutes** (up to a few hours).
- On PC: `ipconfig /flushdns`
- **Incognito:** `https://flipur.trade/`
- **Phone (mobile data):** `https://flipur.trade/`

Success = home loads with **“Psychological trading software…”** title, **no** SSL error.

---

## After DNS fix

Optional redeploy (not required for SSL):

```powershell
npm run deploy:web
```

---

## Checkout “page not found” flash

Brief 404 before thank-you is usually Dodo redirecting to `/checkout/success` before the SPA loads. Payment + Pro still count as success. Tell Agent if you want that polished later.
