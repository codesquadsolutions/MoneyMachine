import { Link } from "react-router-dom";
import { SEO, useSeo } from "../seo";
import { COMPANY } from "../content/trust";

export function Privacy() {
  useSeo({ ...SEO.privacy, path: "/privacy" });
  return (
    <main className="w legal">
      <h1>Privacy Policy</h1>
      <p>Last updated November 12, 2026.</p>
      <h2>What Flipur is</h2>
      <p>
        Flipur is a Chrome extension that flips the side and order type of an order you place on a supported trading
        site, before that order is sent. This website explains the product, sells Pro subscriptions, and hosts our
        partner interest form. Flipur is not a broker and does not give financial advice.
      </p>
      <h2>This website</h2>
      <ul>
        <li>
          <strong>Checkout:</strong> When you subscribe on <Link to="/pricing">pricing</Link>, we send your email and
          plan choice to our payment provider (Dodo Payments). Card data is entered on Dodo-hosted checkout, not on our
          servers.
        </li>
        <li>
          <strong>Affiliate interest:</strong> If you apply to partner, we store name, email, and social links you
          submit so we can contact you. See <Link to="/affiliate/register">partners</Link>.
        </li>
        <li>
          <strong>Affiliate dashboard:</strong> Onboarded partners sign in with email/password via Firebase
          Authentication.
        </li>
        <li>
          <strong>Support chat:</strong> The on-site chat widget (hosted at my-bot.onrender.com) processes messages you
          send there so we can answer product questions; do not share card numbers or passwords in chat.
        </li>
        <li>
          <strong>Referral codes:</strong> If you land with <code>?ref=</code> in the URL, we store the code in your
          browser for up to 30 days to apply at checkout.
        </li>
      </ul>
      <p>
        Site infrastructure uses Firebase (Google). The product reel may load embedded media from third parties (e.g.
        Instagram), which may receive technical data such as your IP address.
      </p>
      <h2>The extension</h2>
      <p>
        The extension acts in your browser on supported order requests. It changes orders you choose to place; it does
        not custody funds or open brokerage accounts. See <Link to="/security">Security & data</Link> for details.
      </p>
      <h2>Contact</h2>
      <p>
        Questions or deletion requests:{" "}
        <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>.
      </p>
      <p>
        <Link to="/">Back to Flipur</Link>
      </p>
    </main>
  );
}

export function Terms() {
  useSeo({ ...SEO.terms, path: "/terms" });
  return (
    <main className="w legal">
      <h1>Terms of Service</h1>
      <p>Last updated November 12, 2026.</p>
      <h2>The product</h2>
      <p>
        Flipur is psychological software. It flips the side and order type of orders you place in your browser on
        ProjectX, Delta Exchange, TradingView, and Match-Trader. One Pro subscription covers every supported platform. It
        is not a broker, not a signal service, and not financial, investment, or trading advice. It is not affiliated
        with those platforms or any prop firm.
      </p>
      <h2>Subscriptions</h2>
      <p>
        Pro access is sold via Dodo Payments. Pricing is shown on <Link to="/pricing">pricing</Link>. You may cancel
        auto-renew through the Dodo customer portal. Cancellation steps are in our{" "}
        <Link to="/billing">Billing & cancellation</Link> page.
      </p>
      <h2>Partners</h2>
      <p>
        Affiliate partners are onboarded by invite after submitting an interest form. Partner coupon codes must be used
        honestly and in line with our brand guidelines.
      </p>
      <h2>Your orders</h2>
      <p>
        You are responsible for every order placed from your account. Trading involves substantial risk of loss. Test on
        a practice or paper account first, and check that your firm's rules allow a browser extension to change an order
        before it is sent. If Flipur does not recognise an order, it sends that order unchanged.
      </p>
      <h2>The site</h2>
      <p>
        We may change the site, product, and these terms. The site is provided as available. If you do not agree, do not
        use Flipur or this website.
      </p>
      <p>
        <Link to="/">Back to Flipur</Link>
      </p>
    </main>
  );
}
