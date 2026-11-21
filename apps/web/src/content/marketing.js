import { COMPANY } from "./trust";

export const platforms = [
  { name: "ProjectX", src: "/platforms/projectx.png", tone: "dark" },
  { name: "Delta Exchange", src: "/platforms/delta.png", tone: "dark" },
  { name: "TradingView", src: "/platforms/tradingview.png", tone: "light" },
  { name: "Match-Trader", src: "/platforms/match-trader.png", tone: "light" },
];

export const features = [
  ["⚡", "Instant flip", "Buy becomes sell and sell becomes buy the moment you click, before the order leaves your browser."],
  ["🎯", "Exact price levels", "Limit and stop orders swap type at the price you marked, so nothing fills at market by accident."],
  ["🪞", "Mirrored brackets", "Where a platform uses brackets, your stop-loss and take-profit swap sides so they stay valid for the flipped trade."],
  ["🔍", "Transparent", "Every flip is logged in the browser console with the before and after payload, and server rejections are reported."],
  ["🧩", "Browser-native", "No software to install beyond the extension. It runs inside Google Chrome."],
];

export const steps = [
  ["1", "Download free", "Install Flipur from the Chrome Web Store—no payment required to start."],
  ["2", "Flip five orders", "Use Flipur on ProjectX, Delta Exchange, TradingView, or Match-Trader. Your first five flips are free."],
  ["3", "Go Pro when ready", "On your sixth flip, Flipur prompts you to finish checkout. One subscription covers every supported platform."],
];

export const rules = [
  ["Buy Limit", "Sell Stop", "buy", "sell"],
  ["Sell Limit", "Buy Stop", "sell", "buy"],
  ["Buy Stop", "Sell Limit", "buy", "sell"],
  ["Sell Stop", "Buy Limit", "sell", "buy"],
];

export const faqs = [
  ["When can I install it?", "Download Flipur free from the Chrome Web Store link on flipur.trade. No waitlist."],
  ["Is Flipur really free to try?", "Yes. You get five order flips at no charge. Payment is only requested before your sixth flip if you want to continue."],
  ["Does it slow down my browser?", "Flipur only looks at order requests on supported sites and ignores everything else. It adds no background processes beyond that."],
  ["Is it safe to use with my prop firm account?", "Flipur is a browser-based extension that changes your order before it is sent, so check that your firm's rules allow this. Test on a practice or paper account first. You are responsible for every order placed from your account."],
  ["Which browsers and platforms are supported?", "Google Chrome (version 111 or newer). One Flipur subscription flips orders on ProjectX, Delta Exchange, TradingView, and Match-Trader, on any account you have connected there."],
  ["What if an order is not recognised?", "Flipur sends it unchanged and prints a warning with the original payload in the browser console, so you can see exactly what happened."],
  [
    "How do I subscribe to Pro?",
    "After five free flips, the extension prompts you to finish checkout. You can also subscribe anytime at flipur.trade/pricing. Use the same email at checkout that you use in the extension.",
  ],
  [
    "Pro is not active after I paid",
    "Wait a few minutes, restart Chrome, and try another flip. Check your receipt email matches the address you use in the extension. Still stuck? Email support from flipur.trade/support.",
  ],
  [
    "How do I cancel or stop the next auto-pay?",
    `Turn off auto-renew in the Dodo customer portal (link in your receipt) before your renewal date so you are not charged again. Steps: flipur.trade/billing. Questions: ${COMPANY.supportEmail}.`,
  ],
  [
    "Do affiliate codes stack with launch pricing?",
    "Affiliate codes stored from ?ref= links apply an extra discount at Dodo checkout when valid. Launch pricing is shown on the pricing page before checkout.",
  ],
  [
    "Prop firm rules",
    "Flipur only modifies orders you place; it does not trade for you. Firms differ on extensions and order changes—verify your firm's policy and test on demo or paper first.",
  ],
];

export const platformNotes = {
  ProjectX: {
    does: "Flips supported order types on ProjectX web before submit.",
    doesNot: "Does not bypass firm risk rules or evaluation limits.",
    firm: "Confirm your prop firm's policy on browser extensions.",
  },
  "Delta Exchange": {
    does: "Flips spot and derivatives order forms we recognise in the browser.",
    doesNot: "Does not move funds or access API keys.",
    firm: "You remain responsible for compliance with Delta and local regulations.",
  },
  TradingView: {
    does: "Flips broker-connected order tickets launched from TradingView when supported.",
    doesNot: "Does not change chart data or provide signals.",
    firm: "Depends on your connected broker—check their extension policy.",
  },
  "Match-Trader": {
    does: "Flips supported Match-Trader web order flows.",
    doesNot: "Does not alter server-side brackets beyond mirrored flip logic.",
    firm: "Verify with your broker or prop desk before live use.",
  },
};
