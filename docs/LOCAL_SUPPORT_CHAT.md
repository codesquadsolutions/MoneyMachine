# Local support chat (Flipur widget + knowledge base)

The marketing site loads your lightweight widget from `SupportChat.jsx`. Answers come from the **chatbot** server + `kb/flipur.md` (synced from this repo’s knowledge base).

## One-time setup

1. **Gemini API key** (free tier): https://aistudio.google.com  
2. In `Desktop/voice/chatbot/chatbot/server`:

   ```powershell
   cd C:\Users\ADMIN\OneDrive\Desktop\voice\chatbot\chatbot\server
   npm install
   copy .env.example .env
   ```

   Edit `.env`: paste `GEMINI_API_KEY`, set `GEMINI_MODEL=gemini-3.5-flash-lite` (older model names in the README often 404), keep `ALLOWED_ORIGINS=http://localhost:5173,https://flipur.trade`

3. **Refresh knowledge** after editing `docs/Flipur-BotPenguin-Knowledge-Base.md` and/or short Q&A in `docs/flipur-faq-qa.md`:

   ```powershell
   npm run sync:chat-kb
   ```

   Restart the chat server (KB reloads on boot).

## Run locally (two terminals)

**Terminal A — chat API + widget**

```powershell
cd C:\Users\ADMIN\OneDrive\Desktop\voice\chatbot\chatbot\server
npm run dev
```

Check: http://localhost:3000/health → `{"ok":true,"embeddings":true}` when vector index is ready (first boot may take a minute while chunks embed; cached in `server/.cache/`).

**Terminal B — Flipur site**

```powershell
cd C:\Users\ADMIN\OneDrive\Desktop\TS\X\claude\MoneyMachine
npm run dev:web
```

Open http://localhost:5173 → green chat bubble → ask e.g. “How much is Pro?” or “Which platforms?”

In dev, the **bubble** loads from `apps/web/public/support-widget/sdk.js` (same origin as Vite). **Replies** still need the chat server on port **3000** (`npm run dev` in `chatbot/server`). Run `npm run sync:chat-kb` after KB/UI widget changes to refresh `sdk.js` in public.

## Production

Deploy the `chatbot` folder to Render (`server` as root). Set `ALLOWED_ORIGINS=https://flipur.trade`. Production site falls back to `https://my-bot.onrender.com/widget/sdk.js` unless `VITE_SUPPORT_CHAT_SDK_URL` is set at build time.