import { NeonMark } from "./NeonMark";
import { WaitlistForm } from "./WaitlistForm";
import { FlipDemo } from "./FlipDemo";
import { InstagramFollow, ProductReel } from "./ProductReel";

const features = [
  ["⚡", "Instant flip", "Buy becomes sell and sell becomes buy the moment you click, before the order leaves your browser."],
  ["🎯", "Exact price levels", "Limit and stop orders swap type at the price you marked, so nothing fills at market by accident."],
  ["🪞", "Mirrored brackets", "On TradingView, your stop-loss and take-profit swap sides so they stay valid for the flipped trade."],
  ["🔍", "Transparent", "Every flip is logged in the browser console with the before and after payload, and server rejections are reported."],
  ["🧩", "Browser-native", "No software to install beyond the extension. It runs inside Google Chrome."],
];

const steps = [
  ["1", "Join the waitlist", "We email you the install link when Flipur is ready."],
  ["2", "Open your platform", "Go to TopstepX or TradingView and reload the tab."],
  ["3", "Trade as normal", "Right-click, paste or use the order ticket. Flipur sends the opposite order at the same price."],
];

const rules = [
  ["Buy Limit", "Sell Stop", "buy", "sell"],
  ["Sell Limit", "Buy Stop", "sell", "buy"],
  ["Buy Stop", "Sell Limit", "buy", "sell"],
  ["Sell Stop", "Buy Limit", "sell", "buy"],
];

const faqs = [
  ["When can I install it?", "Join the waitlist with Google and we email you the install link when Flipur is ready."],
  ["Does it slow down my browser?", "Flipur only looks at order requests on supported sites and ignores everything else. It adds no background processes beyond that."],
  ["Is it safe to use with my prop firm account?", "Flipur is a browser-based extension that changes your order before it is sent, so check that your firm's rules allow this. Test on a practice or paper account first. You are responsible for every order placed from your account."],
  ["Which browsers and platforms are supported?", "Google Chrome (version 111 or newer) on TopstepX and TradingView today. More platforms are planned."],
  ["What if an order is not recognised?", "Flipur sends it unchanged and prints a warning with the original payload in the browser console, so you can see exactly what happened."],
];

export function Home() {
  return (
    <main id="top">
      <div className="w hero">
        <div className="rv">
          <span className="pill">Chrome extension for traders</span>
          <h1>
            Your analysis isn't wrong. <em>Your order placing is.</em>
          </h1>
          <p className="lead">
            Use Flipur to flip your trade. It sits in your browser and flips the side and order type of every order you place — a buy limit becomes a sell stop at the exact same price. No new terminal, no hotkey setup.
          </p>
          <div className="cta">
            <a className="btn s" href="#reel">
              Watch the reel
            </a>
            <a className="btn s" href="#how">
              See how it works
            </a>
          </div>
          <div id="waitlist">
            <WaitlistForm />
          </div>
        </div>
        <div className="vis">
          <NeonMark />
          <div className="flip" role="img" aria-label="Buy limit at 100.34 becomes sell stop at 100.34">
            <div>
              <small>You place</small>
              <b className="buy">BUY LIMIT</b>
              <small>100.34</small>
            </div>
            <i aria-hidden="true">→</i>
            <div>
              <small>Flipur sends</small>
              <b className="sell">SELL STOP</b>
              <small>100.34</small>
            </div>
          </div>
        </div>
      </div>
      <div className="bar">
        <div className="w">
          <span>Works on</span>
          <span className="tag">TopstepX</span>
          <span className="tag">TradingView</span>
          <span className="tag soon">More platforms coming</span>
        </div>
      </div>
      <section id="reel">
        <div className="w reel">
          <h2>What Flipur is, and why it exists.</h2>
          <p className="sub">The reel shows the problem, how a flip works, and why we built it.</p>
          <ProductReel />
          <InstagramFollow />
        </div>
      </section>
      <section id="features">
        <div className="w">
          <h2>Built to do one thing well.</h2>
          <p className="sub">No bloat. Flipur only acts when you place an order on a supported platform.</p>
          <div className="grid">
            {features.map(([icon, title, copy]) => (
              <div className="card" key={title}>
                <div className="ic">{icon}</div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="how">
        <div className="w">
          <h2>Up and running in three steps.</h2>
          <p className="sub">Place orders exactly as you always do.</p>
          <div className="grid">
            {steps.map(([n, title, copy]) => (
              <div className="card step" key={n}>
                <b>{n}</b>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
          <h2 className="rules-head">The flip rules</h2>
          <p className="sub rules-sub">Market orders flip to the opposite-side market order. Try a case below.</p>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>You place</th>
                  <th>Flipur sends</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(([from, to, fromSide, toSide]) => (
                  <tr key={from}>
                    <td className={fromSide}>{from}</td>
                    <td className={toSide}>{to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <FlipDemo />
        </div>
      </section>
      <section id="compat">
        <div className="w">
          <h2>Compatibility</h2>
          <p className="sub">We only list what is built and tested. More platforms are added one at a time.</p>
          <div className="grid">
            <div className="card">
              <h3>TopstepX</h3>
              <p>Limit, stop and market orders.</p>
            </div>
            <div className="card">
              <h3>TradingView</h3>
              <p>Limit, stop and market orders with mirrored stop-loss and take-profit.</p>
            </div>
          </div>
        </div>
      </section>
      <section id="faq">
        <div className="w" style={{ maxWidth: 780 }}>
          <h2>FAQ</h2>
          <p className="sub">Straight answers.</p>
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section style={{ paddingTop: 20 }}>
        <div className="w">
          <div className="final">
            <h2>Stop second-guessing your entries.</h2>
            <p className="sub">Join the waitlist. We email you the install link when Flipur is ready.</p>
            <WaitlistForm />
          </div>
        </div>
      </section>
    </main>
  );
}
