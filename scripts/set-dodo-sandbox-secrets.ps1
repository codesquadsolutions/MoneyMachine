# Option B: paste Dodo TEST values only at each Firebase prompt (not in chat).
# Run from repo root after: npx firebase-tools login
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "`nDodo SANDBOX secrets -> Firebase (project: flipur-404bd)`n" -ForegroundColor Cyan
Write-Host "Paste each TEST value when prompted. Input is hidden for API/webhook keys.`n"

Write-Host "Selecting Firebase project flipur-404bd..." -ForegroundColor DarkGray
npx --yes firebase-tools use flipur-404bd | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Run: npx firebase-tools login`nThen: npx firebase-tools use flipur-404bd" -ForegroundColor Red
  exit 1
}

$names = @(
  "DODO_PAYMENTS_API_KEY",
  "DODO_PAYMENTS_WEBHOOK_KEY",
  "DODO_FLIPUR_PRODUCT_ID_MONTHLY",
  "DODO_FLIPUR_PRODUCT_ID_YEARLY"
)

foreach ($name in $names) {
  Write-Host "--- $name ---" -ForegroundColor Yellow
  npx --yes firebase-tools functions:secrets:set $name
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed on $name." -ForegroundColor Red
    Write-Host @"

If you see 'must be on the Blaze plan':
  1) Open: https://console.firebase.google.com/project/flipur-404bd/usage/details
  2) Upgrade to Blaze and attach a billing account (wait 2-5 minutes)
  3) Re-run: .\scripts\set-dodo-sandbox-secrets.ps1

Do NOT run 'firebase login <code>' after 'firebase login' already succeeded.

"@ -ForegroundColor Yellow
    exit $LASTEXITCODE
  }
}

Write-Host "`nAll four secrets set. Next: npm run deploy:sandbox-backend`n" -ForegroundColor Green
