import { useState } from "react";
import { Link } from "react-router-dom";
import { SEO, useSeo } from "../seo";
import { useAuth } from "../auth";
import { callAffiliate } from "../lib/callables";
import { getStoredReferral } from "../lib/referral";
import { PRICING, formatUsd, planTotals } from "../content/pricing";
import { FREE_FLIP_LIMIT } from "../content/download";

function PricingPlanCard({ planKey, autoRenew, onAutoRenewChange, affiliateNote }) {
  const { total, afterPromo, listUsd, plan } = planTotals(planKey, autoRenew);
  const suffix = plan.interval === "year" ? "/year" : "/month";

  return (
    <article className="card pricing-card">
      <h2>{plan.label}</h2>
      <p className="pricing-blurb">{plan.blurb}</p>
      <div className="pricing-rows">
        <div className="pricing-row">
          <span>List price</span>
          <span className="pricing-list">{formatUsd(listUsd)}</span>
        </div>
        <div className="pricing-row pricing-highlight">
          <span>{plan.promoPercent}% off</span>
          <span>{formatUsd(afterPromo)}</span>
        </div>
        <label className="pricing-auto">
          <input
            type="checkbox"
            checked={autoRenew}
            onChange={(e) => onAutoRenewChange(e.target.checked)}
          />
          <span>
            Auto-renew (save extra {plan.autoRenewExtraPercent}%)
            <small>Recurring payment / auto-debit. Cancel anytime in your Dodo customer portal.</small>
          </span>
        </label>
        <div className="pricing-total">
          <span>Your price</span>
          <strong>
            {formatUsd(total)}
            <small>{suffix}</small>
          </strong>
        </div>
        <p className="pricing-note">Taxes are included where Dodo acts as merchant of record. Final total may vary slightly by country.</p>
        {affiliateNote ? <p className="pricing-affiliate">{affiliateNote}</p> : null}
      </div>
    </article>
  );
}

export function PricingPage() {
  useSeo({ ...SEO.pricing, path: "/pricing" });
  const { user } = useAuth();
  const [plan, setPlan] = useState("monthly");
  const [autoRenew, setAutoRenew] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ref = getStoredReferral();
  const affiliateNote = ref ? `Affiliate code ${ref} applies at checkout for an additional discount.` : null;

  const checkoutEmail = (user?.email || email).trim();

  async function onCheckout() {
    setError("");
    if (!checkoutEmail) {
      setError("Enter your email to continue.");
      return;
    }
    setBusy(true);
    try {
      const { checkoutUrl } = await callAffiliate("createCheckoutSession", {
        email: checkoutEmail,
        name: user?.displayName || "",
        plan,
        autoRenew,
        discountCode: ref,
      });
      if (!checkoutUrl) throw new Error("No checkout URL returned.");
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err.message || "Could not start checkout. Try again or download the free extension first.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <section className="pricing-hero">
        <div className="w">
          <h1>Pricing</h1>
          <p className="sub">
            Pro pricing after your free trial flips. One subscription for ProjectX, Delta Exchange, TradingView, and Match-Trader—50% off list, plus 5% when you opt in to auto-renew.
          </p>
        </div>
      </section>
      <section className="pricing-body">
        <div className="w pricing-layout">
          <div className="pricing-pick">
            <div className="pricing-tabs" role="tablist" aria-label="Billing period">
              <button
                type="button"
                className={plan === "monthly" ? "active" : ""}
                onClick={() => setPlan("monthly")}
                role="tab"
                aria-selected={plan === "monthly"}
              >
                Monthly
              </button>
              <button
                type="button"
                className={plan === "yearly" ? "active" : ""}
                onClick={() => setPlan("yearly")}
                role="tab"
                aria-selected={plan === "yearly"}
              >
                Yearly
              </button>
            </div>
            <PricingPlanCard
              planKey={plan}
              autoRenew={autoRenew}
              onAutoRenewChange={setAutoRenew}
              affiliateNote={affiliateNote}
            />
            {!user ? (
              <label className="pricing-email">
                <span>Email for receipts &amp; access</span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            ) : (
              <p className="pricing-signed">Checkout as {user.email}</p>
            )}
            <button className="btn p pricing-checkout" type="button" disabled={busy} onClick={onCheckout}>
              {busy ? "Opening checkout…" : `Subscribe — ${plan === "yearly" ? "yearly" : "monthly"}`}
            </button>
            {error ? <p className="err">{error}</p> : null}
            <p className="pricing-alt">
              Not ready to pay yet?{" "}
              <Link to={{ pathname: "/", hash: "download" }}>
                Add to Chrome for free
              </Link>{" "}
              ({FREE_FLIP_LIMIT} free flips) or read the <Link to="/faq">FAQ</Link>.
            </p>
          </div>
          <aside className="pricing-aside card">
            <h3>What you get</h3>
            <ul>
              <li>Chrome extension — flip order side &amp; type before send</li>
              <li>All four supported web platforms on one subscription</li>
              <li>Console-transparent execution logs</li>
              <li>Psychological trading tool — not financial advice</li>
            </ul>
            <h3>Compare plans</h3>
            <ul className="pricing-compare">
              <li>
                <strong>Monthly</strong> — {formatUsd(PRICING.monthly.listUsd)}/mo list → 50% off → optional 5% auto-renew
              </li>
              <li>
                <strong>Yearly</strong> — {formatUsd(PRICING.yearly.listUsd)}/yr list → 50% off → optional 5% auto-renew
              </li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
