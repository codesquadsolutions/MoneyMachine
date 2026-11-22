# Support chat (n8n + Flipur widget)

Production support chat on https://flipur.trade uses the **engine SDK** + an **n8n Chat Trigger** webhook. Knowledge for the agent: [flipur-n8n-knowledge-base.md](./flipur-n8n-knowledge-base.md).

## Production (default)

`apps/web/src/components/SupportChat.jsx` loads:

| Setting | Default |
|---------|---------|
| SDK | `/support-widget/engine-sdk.js` |
| Webhook | `https://n8n.codesquadsolutions.com/webhook/54827097-2aa9-4332-bf43-323b29c99b75/chat` |
| Bot id | `n8n-flipur` |

Overrides at build time:

```env
# apps/web/.env.production or .env.local
VITE_SUPPORT_CHAT_WEBHOOK_URL=https://n8n.codesquadsolutions.com/webhook/…/chat
VITE_SUPPORT_CHAT_SDK_URL=/support-widget/engine-sdk.js
```

Keep the n8n agent system prompt / Google Doc KB in sync with `docs/flipur-n8n-knowledge-base.md`.

CRM lead ingest from chat (optional): `POST https://api.flipur.trade/api/crm/ingest` with header `x-crm-secret: $CRM_INGEST_SECRET` (see `api/.env.example`).

---

## Local site + production n8n (simplest)

```bash
npm run dev:web
```

Open http://localhost:5173 — bubble uses local `engine-sdk.js` and the default n8n webhook (CORS must allow localhost on the n8n side if you restrict origins).

---

## Optional: local Gemini chatbot (legacy / offline KB)

Older path used a Desktop `voice/chatbot` server + BotPenguin-era markdown. Prefer n8n for production. If you still run the local bot:

1. Gemini API key in the chatbot server `.env`
2. Sync KB copies:

   ```powershell
   npm run sync:chat-kb
   ```

   That script copies `docs/Flipur-BotPenguin-Knowledge-Base.md` / FAQ into the external chatbot KB and may overwrite `apps/web/public/support-widget/sdk.js` (legacy SDK — production uses **`engine-sdk.js`**).

3. Run chatbot server (port 3000) + `npm run dev:web`.

Do **not** point production at `my-bot.onrender.com` unless you intentionally revive that stack.

---

## Related

- Widget UI: `apps/web/public/support-widget/engine-sdk.js`
- Agent KB: [flipur-n8n-knowledge-base.md](./flipur-n8n-knowledge-base.md)
- Short FAQ: [flipur-faq-qa.md](./flipur-faq-qa.md)
