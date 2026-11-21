/** Company & trust copy — update operator name and emails before legal review. */

export const COMPANY = {
  name: "Flipur",
  legalName: "Codesquad Solutions Pvt. Ltd.",
  site: "https://flipur.trade",
  supportEmail: "makemoney@flipur.trade",
  partnerEmail: "makemoney@flipur.trade",
  instagram: "https://www.instagram.com/flipurtrade",
};

export const BILLING_POLICY = {
  summary:
    "Flipur Pro is a subscription billed through Dodo Payments (merchant of record). If you opt in to auto-renew at checkout, Dodo charges you each billing period until you turn auto-renew off.",
  cancelIntro:
    "To stop the next charge, turn off auto-renew before your renewal date. You keep Pro until the end of the period you already paid for.",
  steps: [
    "Open the Dodo customer portal from the link in your receipt email (or the billing portal link on this site when configured).",
    "Sign in with the same email you used at checkout.",
    "Turn off auto-renew / cancel the subscription so you are not charged again.",
  ],
  note: "Questions about billing or cancellation? See Billing & cancellation on flipur.trade or email us.",
};

/** @deprecated use BILLING_POLICY */
export const REFUND_POLICY = BILLING_POLICY;

export const securityBullets = [
  "Flipur runs inside Google Chrome on pages you visit. It does not hold customer funds or connect to your broker's back office.",
  "The extension intercepts supported order payloads in the browser, flips side and order type, and forwards the modified request. Unrecognized orders pass through unchanged.",
  "Flipur logs before/after payloads in the browser console for transparency. Those logs stay on your device unless you share them with support.",
  "This website stores affiliate interest forms and payment-related metadata on Firebase. Checkout card data is handled only by Dodo, not on our servers.",
  "We request the minimum Chrome permissions needed to detect supported order forms on trading sites you use.",
];

export const supportSteps = [
  {
    title: "Install free",
    body: "Add Flipur from the Chrome Web Store. You get five order flips at no charge.",
  },
  {
    title: "Pro not unlocking",
    body: `Complete checkout with the same email you use in the extension. Restart Chrome, then try another flip. Still stuck? Email ${COMPANY.supportEmail} with your checkout email and payment date.`,
  },
  {
    title: "Billing & cancellation",
    body: "Manage subscription and turn off auto-renew in the Dodo customer portal (link in your receipt email). See Billing & cancellation on this site for steps.",
  },
  {
    title: "Prop firm rules",
    body: "You are responsible for complying with your firm's rules on extensions and order modification. Test on demo or paper first.",
  },
];

export const aboutParagraphs = [
  "Flipur exists for one job: when you know your analysis is sound but your finger betrays you, flip the order before it leaves the browser—same price, opposite side and type.",
  "We built the first Chrome-native tool focused on execution psychology—not journals, not signals, but the moment you click send.",
  "One Pro subscription covers ProjectX, Delta Exchange, TradingView, and Match-Trader. Flipur is psychological software, not a broker and not financial advice.",
];
