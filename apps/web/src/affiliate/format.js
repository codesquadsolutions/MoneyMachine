export function money(cents) {
  const value = (Number(cents) || 0) / 100;
  return value.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function bpsToPercent(bps) {
  return `${((Number(bps) || 0) / 100).toFixed(1)}%`;
}
