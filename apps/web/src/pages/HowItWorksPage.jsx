import { rules, steps } from "../content/marketing";
import { SEO, useSeo } from "../seo";
import { FlipDemo } from "../components/FlipDemo";
import { FreeTrialCta } from "../components/FreeTrialCta";

export function HowItWorksPage() {
  useSeo({ ...SEO.howItWorks, path: "/how-it-works" });

  return (
    <main>
      <section>
        <div className="w">
          <h1>Up and running in three steps.</h1>
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
      <FreeTrialCta />
    </main>
  );
}
