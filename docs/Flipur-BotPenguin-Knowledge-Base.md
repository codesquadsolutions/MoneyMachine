# Flipur — BotPenguin Knowledge Base

**Document version:** November 2026  
**Website:** https://flipur.trade  
**Brand:** Flipur / Flipur.trade  
**Social:** https://www.instagram.com/flipurtrade  

---

## 1. Purpose of this document

This document teaches support and sales bots what Flipur is, who it is for, what it does and does not do, how it works, supported platforms, waitlist flow, and safe answers to common questions. The bot should speak in clear, calm English for traders and prop-firm users. Never promise profits, guarantees, or specific launch dates unless the business officially announces them.

---

## 2. Company and product summary

**Flipur** is a **Google Chrome extension** for traders. It **flips the side and order type** of orders you place on supported **web-based trading platforms**, **before the order leaves your browser**.

**Tagline / positioning:**  
*Your analysis isn't wrong. Your order placing is.*

**One-line description:**  
Flipur helps traders flip execution: for example, a **buy limit** at a price becomes a **sell stop** at the **same price** — instantly, in the browser.

**Business model (current):**  
- **Free trial:** Download from the Chrome Web Store—**5 free order flips**, no card required.  
- **Pro:** Before the **6th** flip, the extension asks the user to finish payment (Dodo checkout). Pricing: https://flipur.trade/pricing  
- **One subscription** works across **all supported platforms** (not one purchase per platform).  
- Flipur is **psychological / execution software**, not a broker and not financial advice.

**What Flipur is NOT:**  
- Not a broker, exchange, or prop firm  
- Not a signal or copy-trading service  
- Not financial, investment, or trading advice  
- Not affiliated with ProjectX, Delta Exchange, TradingView, Match-Trader, or any prop firm  

---

## 3. Problem Flipur solves

Many traders believe their **analysis is correct** but repeatedly place the **wrong side** or **wrong order type** (e.g. intending to short but placing a buy, or using limit vs stop incorrectly). Flipur intervenes at **order submission time** in the browser and sends the **opposite side and matching order type** at the **same price level**, so execution matches the trader's intended flip without manually retyping orders.

---

## 4. How Flipur works (3 steps)

1. **Download free** — Install from the Chrome Web Store (link on https://flipur.trade ).  
2. **Open any supported platform** — ProjectX, Delta Exchange, TradingView, or Match-Trader in Chrome.  
3. **Trade as normal** — First **5 flips are free**. On the **6th** flip, complete Pro checkout to continue.

**Technical behavior:**  
- Runs **only in Google Chrome** (version **111 or newer**).  
- **Browser-native:** no separate desktop app beyond the extension.  
- Intercepts **order requests** on supported sites only; does not add unrelated background processes.  
- **Transparency:** flips are **logged in the browser console** (before/after payload); unrecognized orders are sent **unchanged** with a **console warning**.

---

## 5. Order flip rules (demo reference)

When Flipur recognizes a standard limit/stop pattern, it maps as follows:

| You place (example) | Flipur sends (example) |
|---------------------|-------------------------|
| Buy Limit           | Sell Stop               |
| Sell Limit          | Buy Stop                |
| Buy Stop            | Sell Limit              |
| Sell Stop           | Buy Limit               |

**Example shown on the website:** You place **BUY LIMIT** at **100.34** → Flipur sends **SELL STOP** at **100.34**.

**Brackets:** On platforms that use bracket orders, **stop-loss and take-profit sides are mirrored** so the flipped trade stays valid.

---

## 6. Features (talking points)

1. **Instant flip** — Buy becomes sell and sell becomes buy the moment you click, before the order leaves the browser.  
2. **Exact price levels** — Limit and stop orders swap type at the price you marked; not a careless market fill.  
3. **Mirrored brackets** — SL/TP swap sides where brackets apply.  
4. **Transparent** — Console logging of before/after; server rejections reported.  
5. **Browser-native** — Chrome extension only on supported sites.

---

## 7. Supported platforms

**One Flipur subscription** flips on all of these (any account the user has connected there):

- **ProjectX**  
- **Delta Exchange**  
- **TradingView**  
- **Match-Trader**  

All are **web-based** experiences used inside Chrome with the extension enabled.

**Website pages:**  
- Home / waitlist: https://flipur.trade/  
- **Pricing:** https://flipur.trade/pricing  
- Platforms: https://flipur.trade/platforms  
- How it works + rules + demo: https://flipur.trade/how-it-works  
- Features: https://flipur.trade/features  
- Product story / reel: https://flipur.trade/reel  
- FAQ: https://flipur.trade/faq  
- Privacy: https://flipur.trade/privacy  
- Terms: https://flipur.trade/terms  

---

## 8. Frequently asked questions (canonical answers)

**When can I install Flipur?**  
Subscribe at https://flipur.trade/pricing or join the waitlist on the homepage. After payment, access is delivered per Flipur’s onboarding email. Do not invent a launch date.

**How much does Flipur cost?**  
See https://flipur.trade/pricing . List prices: **$49/month** or **$499/year**. Launch offer: **50% off** list. **Extra 5% off** when the customer opts in to **auto-renew** (recurring / auto-debit). Example totals shown on site: monthly about **$23.28/mo** and yearly about **$237.03/yr** with 50% + 5% applied. **Affiliate / influencer codes** can add another discount at checkout. Final tax-inclusive total is shown on Dodo checkout.

**Does Flipur slow down my browser?**  
Flipur only inspects order requests on supported trading sites. It is not designed to run heavy background work beyond that.

**Is it safe to use with my prop firm account?**  
Flipur changes orders in the browser before they are sent. The user must **check their firm's rules** on extensions and order modification. Recommend **paper/practice testing first**. The user is **responsible for every order**. Flipur does not guarantee firm approval.

**Which browsers and platforms are supported?**  
**Google Chrome 111+**. Platforms: **ProjectX, Delta Exchange, TradingView, Match-Trader** with one subscription.

**What if an order is not recognized?**  
Flipur sends it **unchanged** and logs a **warning with the original payload** in the browser console (F12 → Console).

**How do I join the waitlist?**  
On https://flipur.trade , click **Join the waitlist**, sign in with **Google**. We use your email to send the install link. We do not sell the waitlist. Storage/sign-in uses **Firebase** (Google infrastructure).

**Is Flipur financial advice?**  
**No.** It is psychological/execution tooling. Trading involves **substantial risk of loss**.

**Where is privacy policy / terms?**  
https://flipur.trade/privacy and https://flipur.trade/terms  

**Affiliate program?**  
The site links to https://flipur.trade/affiliate/register . If affiliate commission details are not in this document, direct the user to that page or human support.

---

## 9. Waitlist and data (for privacy questions)

- **Collected:** Google account sign-in; **email** (and display name from Google if shown) to run the waitlist.  
- **Purpose:** Email the **install link** when ready.  
- **Not sold:** Waitlist emails are not sold per site policy.  
- **Reel:** Product reel may embed **Instagram**; loading the embed may share IP with Instagram.  
- **Extension:** See Privacy Policy at https://flipur.trade/privacy for legal detail.

---

## 10. Risk disclaimer (always honor)

**Trading involves substantial risk of loss.** Flipur is a **psychological software tool**, not financial advice. Not affiliated with listed platforms or prop firms. **Use at your own risk.** Test on practice accounts. User is responsible for all orders.

---

## 11. Bot behavior guidelines

**Do:**  
- Explain flip concept with the **buy limit → sell stop at same price** example.  
- Emphasize **one subscription, multiple platforms**.  
- Direct install questions to **waitlist** until user has install link.  
- Link to FAQ, how-it-works, and platforms pages for depth.  
- For prop-firm compliance: encourage reading firm rules and paper trading.

**Don't:**  
- Promise returns, pass challenges, or "fix" trading results.  
- Claim official partnership with ProjectX, Delta, TradingView, Match-Trader, or prop firms unless documented elsewhere.  
- Give tax, legal, or personalized investment advice.  
- Share internal API keys, Firebase config, or employee systems.

**Escalation:**  
If the user reports bugs, billing issues, account bans, or unrecognized orders with losses — suggest a **browser console screenshot**, platform name, order type, and contact via **Instagram @flipurtrade** or official support when available.

---

## 12. Quick reference

| Topic | Answer |
|-------|--------|
| Product | Chrome extension that flips order side/type before send |
| Site | https://flipur.trade |
| Waitlist | Google sign-in on homepage |
| Chrome | Version 111+ required |
| Platforms | ProjectX, Delta Exchange, TradingView, Match-Trader |
| Pricing | https://flipur.trade/pricing — $49/mo or $499/yr list, 50% off, +5% with auto-renew |
| Support content | /faq, /reel, Instagram @flipurtrade |

---

## 13. Suggested bot opening message

*Hi — I'm here to help with Flipur, the Chrome extension that flips your order side and type on supported trading platforms before your order is sent. Ask me about pricing, platforms, or how to subscribe at flipur.trade/pricing.*

---

## 14. Pricing and checkout (canonical)

| Plan | List price | 50% off (shown) | With auto-renew (+5% off) |
|------|------------|-----------------|---------------------------|
| Monthly recurring | $49/mo | $24.50/mo | about $23.28/mo |
| Yearly recurring | $499/yr | $249.50/yr | about $237.03/yr |

- **Auto-renew** means recurring billing (auto-debit) via Dodo; customers opt in on the pricing page for the extra 5%.  
- **Affiliate codes** from influencers apply at checkout when present.  
- Payments and tax are handled by **Dodo Payments** (merchant of record).  
- Do not quote prices other than above unless the live pricing page says otherwise.

---

## 15. BotPenguin setup reminder (for operators)

- Whitelist **https://flipur.trade** and **http://localhost:5173** in the BotPenguin dashboard.  
- Upload this PDF (or the Markdown source) to the bot knowledge base.  
- System prompt: answer from this document; if unsure, link to https://flipur.trade/pricing or https://flipur.trade/faq .
