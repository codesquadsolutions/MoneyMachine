import { useEffect } from "react";

export const SITE_URL = "https://flipur.trade";
export const SITE_NAME = "Flipur";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og.png`;

export const SEO = {
  home: {
    title: "Flipur.trade – Psychological trading software. Fix the click, not the chart.",
    description:
      "Your analysis isn't wrong—your order placing is. Flipur flips side and type in Chrome before the order sends. Five free flips, then Pro. ProjectX, Delta Exchange, TradingView, Match-Trader. Execution psychology, not financial advice.",
  },
  privacy: {
    title: "Privacy Policy – Flipur.trade",
    description:
      "How Flipur.trade handles checkout, affiliate interest, partner accounts, the Chrome extension, and support chat. Updated November 2026.",
  },
  terms: {
    title: "Terms of Service – Flipur.trade",
    description:
      "Terms for the Flipur Chrome extension and flipur.trade: psychological trading software, subscriptions, partners, not a broker or financial advice.",
  },
  security: {
    title: "Security & data – Flipur Chrome extension",
    description: "How Flipur handles order data in the browser, logging, payments, and what we do not access.",
  },
  billing: {
    title: "Billing & cancellation – Flipur Pro",
    description:
      "How Flipur Pro subscriptions work with Dodo Payments and how to turn off auto-renew so you are not charged again.",
  },
  about: {
    title: "About Flipur – Trading psychology in Chrome",
    description: "Why Flipur exists, who operates it, and how to contact the team.",
  },
  support: {
    title: "Support – Flipur.trade",
    description: "Install help, Pro activation, billing, and prop firm guidance for Flipur users.",
  },
  checkoutSuccess: {
    title: "Subscription received – Flipur",
    description: "Next steps after Flipur Pro checkout: extension unlock, support, and billing.",
  },
  notFound: {
    title: "Page not found – Flipur.trade",
    description: "This page is not on Flipur.trade. Return to the Flipur Chrome extension site for traders.",
  },
  reel: {
    title: "What Flipur is – Product reel | Flipur.trade",
    description:
      "Watch how Flipur flips trader execution in the browser: the problem, the flip, and why we built a Chrome extension for trading psychology and order placement.",
  },
  features: {
    title: "Features – Instant order flip for traders | Flipur.trade",
    description:
      "Flipur features: instant side and order-type flip, exact limit/stop levels, mirrored brackets, console transparency, and Chrome-native execution on web trading platforms.",
  },
  howItWorks: {
    title: "How Flipur works – Flip rules & demo | Flipur.trade",
    description:
      "Three steps to use Flipur, buy/sell limit and stop flip rules, and an interactive demo. Flip orders before they leave your browser on supported platforms.",
  },
  platforms: {
    title: "Supported platforms – One Flipur subscription | Flipur.trade",
    description:
      "Flipur works on ProjectX, Delta Exchange, TradingView, and Match-Trader with one subscription. Flip orders on every platform your account is connected to.",
  },
  faq: {
    title: "FAQ – Flipur Chrome extension | Flipur.trade",
    description:
      "Answers about installing Flipur, prop firm rules, supported browsers and platforms, performance, and unrecognized orders.",
  },
  pricing: {
    title: "Pricing – Monthly & yearly subscription | Flipur.trade",
    description:
      "Flipur pricing: $49/mo or $499/yr list, 50% launch discount, plus 5% off when you opt in to auto-renew. One subscription for ProjectX, Delta Exchange, TradingView, and Match-Trader.",
  },
};

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Flipur",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: ["https://www.instagram.com/flipurtrade"],
  description:
    "Flipur builds browser tools that help traders flip order side and type on web trading platforms.",
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Flipur.trade",
  url: SITE_URL,
  publisher: { "@type": "Organization", name: "Flipur" },
  inLanguage: "en",
};

export function buildSoftwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Flipur",
    applicationCategory: "BrowserApplication",
    operatingSystem: "Chrome",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Five free order flips; paid Pro subscription after trial.",
    },
    description:
      "Psychological trading software for execution: flips order side and type in Chrome before the request is sent. Try five flips free.",
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
  };
}

export function buildFaqPageJsonLd(faqPairs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqPairs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

function upsertMeta(selector, create) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

function setMetaContent(attr, key, content) {
  if (content == null || content === "") return;
  const el = upsertMeta(`meta[${attr}="${key}"]`, () => {
    const node = document.createElement("meta");
    node.setAttribute(attr, key);
    return node;
  });
  el.setAttribute("content", content);
}

function setCanonical(href) {
  const el = upsertMeta('link[rel="canonical"]', () => {
    const node = document.createElement("link");
    node.setAttribute("rel", "canonical");
    return node;
  });
  el.setAttribute("href", href);
}

function setJsonLdScript(id, graphs) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  if (!graphs?.length) return;
  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(graphs.length === 1 ? graphs[0] : graphs);
  document.head.appendChild(script);
}

/**
 * Updates document title, meta description, canonical, Open Graph, Twitter, and optional JSON-LD.
 * Does not change visible page body content.
 */
export function useSeo({ title, description, path = "/", jsonLd, robots }) {
  useEffect(() => {
    const url = path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

    document.title = title;
    setMetaContent("name", "description", description);
    setCanonical(url);

    setMetaContent("name", "robots", robots || "index, follow, max-image-preview:large");

    setMetaContent("property", "og:site_name", SITE_NAME);
    setMetaContent("property", "og:locale", "en_US");
    setMetaContent("property", "og:type", "website");
    setMetaContent("property", "og:title", title);
    setMetaContent("property", "og:description", description);
    setMetaContent("property", "og:url", url);
    setMetaContent("property", "og:image", DEFAULT_OG_IMAGE);

    setMetaContent("name", "twitter:card", "summary_large_image");
    setMetaContent("name", "twitter:title", title);
    setMetaContent("name", "twitter:description", description);
    setMetaContent("name", "twitter:image", DEFAULT_OG_IMAGE);

    const graphs = [ORG_JSON_LD, WEBSITE_JSON_LD, ...(jsonLd || [])];
    setJsonLdScript("flipur-page-jsonld", graphs);

    return () => {
      document.getElementById("flipur-page-jsonld")?.remove();
    };
  }, [title, description, path, jsonLd, robots]);
}
