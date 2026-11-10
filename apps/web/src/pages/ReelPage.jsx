import { SEO, useSeo } from "../seo";
import { InstagramFollow, ProductReel } from "../components/ProductReel";
import { FreeTrialCta } from "../components/FreeTrialCta";

export function ReelPage() {
  useSeo({ ...SEO.reel, path: "/reel" });

  return (
    <main>
      <section className="reel">
        <div className="w">
          <h1>What Flipur is, and why it exists.</h1>
          <p className="sub">The reel shows the problem, how a flip works, and why we built it.</p>
          <ProductReel />
          <InstagramFollow />
        </div>
      </section>
      <FreeTrialCta title="Ready to flip your execution?" />
    </main>
  );
}
