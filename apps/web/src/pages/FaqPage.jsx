import { useMemo } from "react";
import { faqs } from "../content/marketing";
import { SEO, buildFaqPageJsonLd, useSeo } from "../seo";
import { FreeTrialCta } from "../components/FreeTrialCta";

export function FaqPage() {
  const jsonLd = useMemo(() => [buildFaqPageJsonLd(faqs)], []);
  useSeo({ ...SEO.faq, path: "/faq", jsonLd });

  return (
    <main>
      <section>
        <div className="w" style={{ maxWidth: 780 }}>
          <h1>FAQ</h1>
          <p className="sub">Straight answers.</p>
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <FreeTrialCta />
    </main>
  );
}
