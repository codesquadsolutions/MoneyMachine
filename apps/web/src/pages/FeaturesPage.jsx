import { features } from "../content/marketing";
import { SEO, useSeo } from "../seo";
import { FreeTrialCta } from "../components/FreeTrialCta";

export function FeaturesPage() {
  useSeo({ ...SEO.features, path: "/features" });

  return (
    <main>
      <section>
        <div className="w">
          <h1>Built to do one thing well.</h1>
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
      <FreeTrialCta />
    </main>
  );
}
