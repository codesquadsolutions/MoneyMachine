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
];
