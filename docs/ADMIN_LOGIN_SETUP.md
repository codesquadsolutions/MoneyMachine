# Admin app login (flipur-404bd-admin.web.app)

The admin app signs in with **Firebase Email/Password** as **`admin@flipur.trade`** (username `admin` maps to that email).

## One-time Firebase Console (~5 min)

1. [Authentication](https://console.firebase.google.com/project/flipur-404bd/authentication) → **Get started** if Auth was never enabled.

2. **Sign-in method** → **Email/Password** → **Enable** → Save.

3. **Users** → **Add user**:
   - Email: `admin@flipur.trade`
   - Password: same as `.local/operator-login.txt` (or your chosen strong password)

4. [Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/flipur-404bd/authentication/settings):
   - `flipur-404bd-admin.web.app`
   - `flipur-404bd-admin.firebaseapp.com`
   - `localhost` (for `npm run dev:admin`)

## Deploy admin hosting (your PC)

`apps/admin/.env.local` must match `apps/web/.env.local` (all `VITE_FIREBASE_*` fields). Copy from web if missing.

```powershell
cd C:\Users\ADMIN\OneDrive\Desktop\TS\X\claude\MoneyMachine
npm run deploy:admin
```

## After login

- Waitlist dashboard: `/`
- Affiliates: `/affiliate-master`

## Errors

| Message | Fix |
|---------|-----|
| `configuration-not-found` / `operation-not-allowed` | Enable Email/Password (step 2) |
| Wrong password | Reset password for `admin@flipur.trade` in Firebase Users |
| Unauthorized domain | Add admin `.web.app` host (step 4) |
| Missing Firebase web config | Rebuild with `.env.local`, redeploy admin |