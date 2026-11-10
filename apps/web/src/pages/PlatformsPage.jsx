import { platforms } from "../content/marketing";
import { SEO, useSeo } from "../seo";
import { FreeTrialCta } from "../components/FreeTrialCta";

export function PlatformsPage() {
  useSeo({ ...SEO.platforms, path: "/platforms" });

  return (
    <main>
      <section>
        <div className="w">
          <h1>One subscription. Every platform.</h1>
          <p className="sub">
            Buy Flipur once and it flips on ProjectX, Delta Exchange, TradingView, and Match-Trader — wherever your account is already connected.
          </p>
          <div className="grid platform-grid">
            {platforms.map((item) => (
              <div className="card platform-card" key={item.name}>
                <div className={`logo-plate ${item.tone}`}>
                  <img src={item.src} alt="" />
                </div>
                <h3>{item.name}</h3>
                <p>Included. Orders flip here with the same Flipur subscription.</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <FreeTrialCta />
    </main>
  );
}
