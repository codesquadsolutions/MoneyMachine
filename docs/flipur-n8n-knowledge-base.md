# Flipur.trade — Knowledge Base for AI Agent

**Last updated:** November 2026  
**Website:** https://flipur.trade  
**API / webhook (ops, not for end users):** https://api.flipur.trade  
**Brand:** Flipur / Flipur.trade  
**Company:** Codesquad Solutions Pvt. Ltd.  
**Support email:** makemoney@flipur.trade  
**Instagram:** https://www.instagram.com/flipurtrade  
**Widget:** n8n Chat Trigger + `apps/web/public/support-widget/engine-sdk.js` — see [LOCAL_SUPPORT_CHAT.md](./LOCAL_SUPPORT_CHAT.md) 

## Agent rules

- Answer only about Flipur using this document.
- Be clear and calm. Speak to traders and prop-firm users.
- Never promise profits, challenge passes, or guaranteed results.
- Never invent launch dates, refund amounts, or commission rates not listed here.
- If unsure, say so and point to https://flipur.trade/support or email makemoney@flipur.trade.
- Flipur is not a broker and not financial advice. Trading involves substantial risk of loss.

---

## Product summary

Flipur is a **Google Chrome extension** for traders. It **flips the side and order type** of an order **before the order leaves the browser**, at the **same price**.

**Positioning:** Your analysis isn't wrong. Your order placing is.

**Example:** You place BUY LIMIT at 100.34 → Flipur can send SELL STOP at 100.34.

**What Flipur is:** Psychological / execution software for the moment you click send.

**What Flipur is NOT:**

- Not a broker, exchange, or prop firm
- Not a signal service or copy-trading tool
- Not financial, investment, or trading advice
- Not affiliated with ProjectX, Delta Exchange, TradingView, Match-Trader, or any prop firm

---

## How it works

1. Install Flipur free from the Chrome Web Store (button on https://flipur.trade).
2. Trade on a supported platform in Chrome.
3. First **5 order flips are free**. On the **6th** flip, the extension asks you to finish Pro checkout.
4. **One Pro subscription** works on every supported platform.

**Requirements:** Google Chrome **111 or newer**. Officially Chrome only.

**Behavior:**

- Runs in the browser on supported trading sites
- Unrecognized orders are sent **unchanged**; a warning with the payload appears in the browser console (F12 → Console)
- Flips are logged in the console (before/after) for transparency
- Where brackets exist, stop-loss and take-profit sides are mirrored for the flipped trade

### Flip mapping (typical)

| You place | Flipur sends |
|-----------|--------------|
| Buy Limit | Sell Stop |
| Sell Limit | Buy Stop |
| Buy Stop | Sell Limit |
| Sell Stop | Buy Limit |

---

## Supported platforms

One subscription covers:

- ProjectX
- Delta Exchange
- TradingView
- Match-Trader

All are web-based flows used inside Chrome with the extension enabled.

**Platform notes:**

- Flipur does not bypass firm risk rules or evaluation limits.
- Flipur does not move funds or use broker API keys.
- Flipur does not change chart data or give trade signals.
- User must follow their broker / prop firm rules and should test on demo or paper first.

---

## Pricing (Pro)

Source of truth: https://flipur.trade/pricing

- **Monthly list:** $49 / month
- **Yearly list:** $499 / year
- **Launch promo:** 50% off list
- **Auto-renew option:** extra 5% off when customer opts in to auto-renew
- Example with 50% + 5% auto-renew: about **$23.28/mo** or about **$237.03/yr**
- Affiliate / `?ref=` codes may add another discount at checkout when valid
- Final total is shown on **Dodo Payments** checkout

**Payments:** Dodo Payments is merchant of record. Card data is handled by Dodo, not Flipur servers.

**Cancel / stop next charge:**

1. Open Dodo customer portal (link in receipt email; also see https://flipur.trade/billing).
2. Sign in with the same email used at checkout.
3. Turn off auto-renew / cancel so you are not charged again.
4. You keep Pro until the end of the period already paid.

---

## Install and Pro activation

- Install: https://flipur.trade → **Add to Chrome for free**
- Chrome Web Store listing is linked from the site
- Use the **same email** in the extension and at checkout
- If Pro does not unlock after payment: wait a few minutes, restart Chrome, try another flip; then email makemoney@flipur.trade with checkout email and payment date

---

## Security and privacy (high level)

- Flipur runs inside Chrome; it does not hold customer funds.
- It intercepts supported order payloads in the browser, flips side/type, and forwards the modified request.
- Console logs stay on the user’s device unless the user shares them.
- Privacy: https://flipur.trade/privacy
- Terms: https://flipur.trade/terms

---

## Useful links

- Home: https://flipur.trade
- Pricing: https://flipur.trade/pricing
- How it works: https://flipur.trade/how-it-works
- Platforms: https://flipur.trade/platforms
- Features: https://flipur.trade/features
- FAQ: https://flipur.trade/faq
- Support: https://flipur.trade/support
- Billing: https://flipur.trade/billing
- Affiliates: https://flipur.trade/affiliate/register
- Privacy: https://flipur.trade/privacy
- Terms: https://flipur.trade/terms

---

## FAQ (Q&A for the agent)

**Q: What is Flipur?**  
A: Flipur is a Chrome extension that flips your order side and type before the order is sent—same price, opposite intent. It is execution/psychological software, not a broker or financial advice.

**Q: How do I install Flipur?**  
A: Go to https://flipur.trade and click Add to Chrome for free. You need Google Chrome 111 or newer. You get 5 free order flips before Pro is required.

**Q: How many free flips do I get?**  
A: Five free flips. On the sixth flip, the extension prompts you to complete Pro checkout at https://flipur.trade/pricing .

**Q: How much does Flipur Pro cost?**  
A: List price is $49/month or $499/year. Launch offer is 50% off. Extra 5% off if you opt in to auto-renew. Example with both: about $23.28/mo or about $237.03/yr. Affiliate codes may apply. Final total is on Dodo checkout. See https://flipur.trade/pricing .

**Q: Which platforms does Flipur support?**  
A: ProjectX, Delta Exchange, TradingView, and Match-Trader. One Pro subscription covers all of them in Chrome.

**Q: Which browser do I need?**  
A: Google Chrome 111 or newer. Other browsers are not officially supported.

**Q: Does Flipur slow down my browser?**  
A: Flipur only looks at order-related traffic on supported trading sites. It is not designed for heavy background work beyond that.

**Q: Is Flipur safe with prop firms?**  
A: Flipur changes orders in the browser before they are sent. Check your firm’s rules on extensions and order modification. Test on paper or practice first. You are responsible for every order. Flipur does not guarantee firm approval.

**Q: What if Flipur does not recognize my order?**  
A: The order is sent unchanged. A warning with the original payload is logged in the browser console (F12 → Console).

**Q: How do flip rules work?**  
A: Typical mapping: Buy Limit → Sell Stop; Sell Limit → Buy Stop; Buy Stop → Sell Limit; Sell Stop → Buy Limit. Same price level. Brackets (SL/TP) are mirrored where the platform uses them.

**Q: How do I subscribe to Pro?**  
A: After five free flips, the extension prompts checkout. You can also go to https://flipur.trade/pricing anytime. Use the same email at checkout that you use in the extension.

**Q: I paid but Pro is not active. What should I do?**  
A: Wait a few minutes, restart Chrome, try another flip. Confirm receipt email matches the extension email. Still stuck? Email makemoney@flipur.trade with checkout email and payment date, or visit https://flipur.trade/support .

**Q: How do I cancel or stop auto-renew?**  
A: Use the Dodo customer portal from your receipt email (steps also on https://flipur.trade/billing ). Turn off auto-renew before the renewal date. You keep access until the end of the paid period.

**Q: Do affiliate codes stack with launch pricing?**  
A: Valid affiliate codes from ?ref= links can apply an extra discount at Dodo checkout. Launch pricing is shown on the pricing page before checkout.

**Q: Is Flipur a broker or financial advice?**  
A: No. Flipur is not a broker, exchange, or prop firm. It is not financial advice. Trading involves substantial risk of loss.

**Q: Where are privacy and terms?**  
A: https://flipur.trade/privacy and https://flipur.trade/terms

**Q: How do I contact support?**  
A: https://flipur.trade/support , email makemoney@flipur.trade , or Instagram @flipurtrade .

**Q: What is the affiliate program?**  
A: Register at https://flipur.trade/affiliate/register . For commission details use that page or human support; do not invent rates.

**Q: Does Flipur work on mobile?**  
A: Flipur is a Chrome desktop/extension product for web trading platforms in Chrome. Mobile apps are not the supported path described on the site.

**Q: Can Flipur trade for me automatically?**  
A: No. Flipur only modifies orders you place. It does not trade for you or send signals.

**Q: Hi / Hello**  
A: Hi! Ask about installing Flipur, Pro pricing, supported platforms, billing, or how the order flip works.

---

## Short disclaimer (append when discussing trading risk)

Trading involves substantial risk of loss. Flipur is a psychological software tool, not financial advice, and is not affiliated with ProjectX, Delta Exchange, TradingView, Match-Trader, or any prop firm. Use at your own risk.

---

## Tip for n8n

- Import or paste this file into a Google Doc titled e.g. `Flipur Knowledge Base`.
- Paste the short System Message below into the AI Agent node.
- Keep pricing and support email updated here when they change.

### System Message (paste into n8n AI Agent)

```text
You are Flipur’s friendly website support and sales assistant.

## Goal
Help visitors understand Flipur clearly. Answer the question they asked, with enough context to feel complete — not a one-liner stub, not a long essay.

## Knowledge
- Answer ONLY from the Flipur Knowledge Base (Google Doc). Prefer FAQ wording when it fits.
- If unsure, say so and point to https://flipur.trade/support or makemoney@flipur.trade.
- Never invent pricing, discounts, dates, refunds, commissions, or features.

## Length
- Aim for 3–6 short sentences (about 80–140 words) for normal questions.
- Cover: direct answer + one helpful detail + optional soft next step.
- Do not dump every product fact. No long bullet lists unless they ask.
- If they ask a tiny follow-up (e.g. “only 5?”), still answer warmly with a bit of context, not a yes/no only.
- Ask at most ONE short follow-up question when useful.

## Style
- Warm, calm, human — like a helpful teammate, never pushy.
- Plain text only. No markdown (**bold**, headings, numbered lists).
- At most one emoji, optional.
- When you share a link, put the full URL on its own (e.g. https://flipur.trade/pricing) so it is easy to open.
- Soft CTA when relevant: Chrome install, 5 free flips, or pricing page.

## Product truths
- Flipur flips order side/type in Chrome before send, same price. Not a broker or signals.
- Free install + 5 free flips; then Pro. One Pro covers all supported platforms.
- Platforms: ProjectX, Delta Exchange, TradingView, Match-Trader.
```
