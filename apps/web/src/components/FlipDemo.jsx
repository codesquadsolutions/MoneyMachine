import { useState } from "react";
import { flipOrder, orderLabel } from "../flip";

const sides = [
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" },
];

const types = [
  { id: "limit", label: "Limit" },
  { id: "stop", label: "Stop" },
  { id: "market", label: "Market" },
];

export function FlipDemo() {
  const [side, setSide] = useState("buy");
  const [type, setType] = useState("limit");
  const [price, setPrice] = useState("100.34");
  const result = flipOrder(side, type);
  const shownPrice = price.trim() || "—";

  return (
    <div className="demo">
      <div className="row">
        <span className="lbl">Side</span>
        {sides.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === side ? "chip on" : "chip"}
            aria-pressed={item.id === side}
            onClick={() => setSide(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="row">
        <span className="lbl">Type</span>
        {types.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === type ? "chip on" : "chip"}
            aria-pressed={item.id === type}
            onClick={() => setType(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="row">
        <label className="lbl" htmlFor="demo-price">
          Price
        </label>
        <input
          id="demo-price"
          className="price"
          inputMode="decimal"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </div>
      <div className="flip" role="img" aria-label={`${orderLabel(side, type)} at ${shownPrice} becomes ${orderLabel(result.side, result.type)} at ${shownPrice}`}>
        <div>
          <small>You place</small>
          <b className={side}>{orderLabel(side, type)}</b>
          <small>{shownPrice}</small>
        </div>
        <i aria-hidden="true">→</i>
        <div>
          <small>Flipur sends</small>
          <b className={result.side}>{orderLabel(result.side, result.type)}</b>
          <small>{shownPrice}</small>
        </div>
      </div>
    </div>
  );
}
