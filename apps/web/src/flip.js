export function flipOrder(side, type) {
  const opposite = side === "buy" ? "sell" : "buy";
  if (type === "market") return { side: opposite, type: "market" };
  if (type === "limit") return { side: opposite, type: "stop" };
  return { side: opposite, type: "limit" };
}

export function orderLabel(side, type) {
  const sideWord = side === "buy" ? "Buy" : "Sell";
  const typeWord = type === "market" ? "Market" : type === "limit" ? "Limit" : "Stop";
  return `${sideWord} ${typeWord}`;
}
