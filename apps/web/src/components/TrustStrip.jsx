import { chromeStore, stats, testimonials } from "../content/socialProof";
import { chromeWebStoreUrl } from "../content/download";

export function StatsRow() {
  return (
    <div className="trust-stats" aria-label="Quick facts">
      {stats.map((item) => (
        <div className="trust-stat" key={item.label}>
          <b>{item.value}</b>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ChromeStoreBadge() {
  if (!chromeStore.showBadge) return null;
  const store = chromeWebStoreUrl();
  return (
    <a className="cws-badge" href={store} target="_blank" rel="noopener noreferrer">
      <span className="cws-stars" aria-hidden="true">
        ★★★★★
      </span>
      <span>
        <strong>{chromeStore.rating.toFixed(1)}</strong> on Chrome Web Store
        {chromeStore.reviewCount ? ` · ${chromeStore.reviewCount} reviews` : null}
      </span>
    </a>
  );
}

export function TestimonialsSection({ title = "Traders using Flipur" }) {
  return (
    <section className="trust-section">
      <div className="w">
        <h2 className="trust-title">{title}</h2>
        <ChromeStoreBadge />
        <div className="trust-grid">
          {testimonials.map((t) => (
            <blockquote className="card trust-quote" key={t.name}>
              <p>&ldquo;{t.quote}&rdquo;</p>
              <footer>
                <cite>{t.name}</cite>
                <span className="muted sm">{t.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
