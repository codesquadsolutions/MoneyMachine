import { Link } from "react-router-dom";
import { SEO, useSeo } from "../seo";
import {
  COMPANY,
  BILLING_POLICY,
  aboutParagraphs,
  securityBullets,
  supportSteps,
} from "../content/trust";

function TrustLayout({ title, children }) {
  return (
    <main className="w legal">
      <h1>{title}</h1>
      <p className="muted sm">Last updated November 12, 2026.</p>
      {children}
      <p>
        <Link to="/">Back to Flipur</Link>
      </p>
    </main>
  );
}

export function SecurityPage() {
  useSeo({ ...SEO.security, path: "/security" });
  return (
    <TrustLayout title="Security & data">
      <p>How Flipur handles your orders and data in the browser and on this website.</p>
      <ul>
        {securityBullets.map((line) => (
          <li key={line.slice(0, 40)}>{line}</li>
        ))}
      </ul>
      <p>
        Read our <Link to="/privacy">Privacy Policy</Link> for collection on this site and the{" "}
        <Link to="/terms">Terms of Service</Link> for your responsibilities when trading.
      </p>
    </TrustLayout>
  );
}

export function BillingPage() {
  useSeo({ ...SEO.billing, path: "/billing" });
  const portal = import.meta.env.VITE_DODO_CUSTOMER_PORTAL_URL || "";
  return (
    <TrustLayout title="Billing & cancellation">
      <p>{BILLING_POLICY.summary}</p>
      <p>{BILLING_POLICY.cancelIntro}</p>
      <h2>Turn off auto-renew (stop the next charge)</h2>
      <ol>
        {BILLING_POLICY.steps.map((step) => (
          <li key={step.slice(0, 40)}>{step}</li>
        ))}
      </ol>
      {portal ? (
        <p>
          <a className="btn p sm" href={portal} target="_blank" rel="noopener noreferrer">
            Open customer billing portal
          </a>
        </p>
      ) : (
        <p className="note">Use the billing link in your Dodo receipt email to manage auto-renew.</p>
      )}
      <p>
        Need help? Email{" "}
        <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> with your checkout email.
      </p>
      <p>
        See <Link to="/pricing">pricing</Link> and <Link to="/faq">FAQ</Link> for trial flips and Pro activation.
      </p>
    </TrustLayout>
  );
}

export function AboutPage() {
  useSeo({ ...SEO.about, path: "/about" });
  return (
    <TrustLayout title="About Flipur">
      {aboutParagraphs.map((p) => (
        <p key={p.slice(0, 30)}>{p}</p>
      ))}
      <p>
        Operated by <strong>{COMPANY.legalName}</strong> ({COMPANY.name}).
      </p>
      <p>
        <a href={COMPANY.instagram} target="_blank" rel="noopener noreferrer">
          Instagram
        </a>
        {" · "}
        <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>
      </p>
    </TrustLayout>
  );
}

export function SupportPage() {
  useSeo({ ...SEO.support, path: "/support" });
  return (
    <TrustLayout title="Support">
      <p>
        Email us at <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> for support, billing help,
        and partner questions—or use the chat widget on this site.
      </p>
      <h2>Common topics</h2>
      <ul className="support-list">
        {supportSteps.map((step) => (
          <li key={step.title}>
            <strong>{step.title}</strong>
            <p className="sm">{step.body}</p>
          </li>
        ))}
      </ul>
      <p>
        <Link to="/faq">FAQ</Link> · <Link to="/billing">Billing & cancellation</Link> · <Link to="/security">Security</Link>
      </p>
    </TrustLayout>
  );
}
