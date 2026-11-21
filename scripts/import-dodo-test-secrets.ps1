# One-time: paste Dodo TEST keys into .local/dodo-test-secrets.txt (see .local/dodo-test-secrets.example)
# Then run: .\scripts\import-dodo-test-secrets.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$path = Join-Path $PWD ".local\dodo-test-secrets.txt"
if (-not (Test-Path $path)) {
  Write-Host "Create $path from .local/dodo-test-secrets.example first." -ForegroundColor Red
  exit 1
}

npx --yes firebase-tools use flipur-404bd | Out-Null

$lines = Get-Content $path | Where-Object { $_ -match '\S' -and $_ -notmatch '^\s*#' }
$map = @{}
foreach ($line in $lines) {
  if ($line -match '^([^=]+)=(.*)$') {
    $map[$matches[1].Trim()] = $matches[2].Trim()
  }
}

$required = @("DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_KEY")
foreach ($key in $required) {
  if (-not $map[$key]) {
    Write-Host "Missing $key in $path" -ForegroundColor Red
    exit 1
  }
}

$allKeys = @(
  "DODO_PAYMENTS_API_KEY",
  "DODO_PAYMENTS_WEBHOOK_KEY",
  "DODO_FLIPUR_PRODUCT_ID_MONTHLY",
  "DODO_FLIPUR_PRODUCT_ID_YEARLY",
  "DODO_FLIPUR_PRODUCT_ID"
)

foreach ($key in $allKeys) {
  if (-not $map[$key]) { continue }
  $tmp = Join-Path $env:TEMP "flipur-secret-$key.txt"
  Set-Content -NoNewline -Path $tmp -Value $map[$key]
  npx --yes firebase-tools functions:secrets:set $key --data-file $tmp --force
  Remove-Item $tmp -Force
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$monthly = $map["DODO_FLIPUR_PRODUCT_ID_MONTHLY"]
if ($monthly -and -not $map["DODO_FLIPUR_PRODUCT_ID"]) {
  $tmp = Join-Path $env:TEMP "flipur-secret-DODO_FLIPUR_PRODUCT_ID.txt"
  Set-Content -NoNewline -Path $tmp -Value $monthly
  npx --yes firebase-tools functions:secrets:set DODO_FLIPUR_PRODUCT_ID --data-file $tmp --force
  Remove-Item $tmp -Force
}

Write-Host "`nDodo secrets imported. Run: npm run deploy:sandbox-backend`n" -ForegroundColor Green
