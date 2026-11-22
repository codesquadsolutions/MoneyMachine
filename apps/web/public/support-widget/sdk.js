(() => {
  const script =
    document.currentScript || document.getElementById('flipur-support-chat-sdk');
  if (!script?.src) {
    console.error('[Flipur chat] Widget script element not found.');
    return;
  }
  if (document.querySelector('[data-flipur-chat-host]')) return;

  const base = new URL(script.src).origin;
  const esc = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');

  const defaultLogo = (() => {
    try {
      const icon = document.querySelector('link[rel="icon"][href]');
      if (icon?.href) return icon.href;
      return new URL('/logo.png', window.location.origin).href;
    } catch {
      return '';
    }
  })();

  const parseSuggestions = (raw) => {
    if (!raw) {
      return [
        { label: 'Pricing', q: 'How much does Flipur Pro cost?' },
        { label: 'Install', q: 'How do I install Flipur?' },
        { label: 'Platforms', q: 'Which platforms are supported?' },
        { label: 'Free trial', q: 'How many free flips do I get?' },
      ];
    }
    return raw.split('|').map((part) => {
      const [label, q] = part.split(':').map((s) => s.trim());
      return { label: label || q, q: q || label };
    });
  };

  const cfg = {
    title: script.dataset.title || 'Chat with us',
    color: script.dataset.color || '#00f59b',
    logo: script.dataset.logo || defaultLogo,
    welcome: script.dataset.welcome || 'Hi! How can I help you today?',
    // Prefer n8n Chat Trigger webhook; fall back to legacy chatbot /api/chat base.
    webhook: script.dataset.webhook || '',
    api: script.dataset.api || base,
    theme: script.dataset.theme || 'dark',
    suggestions: parseSuggestions(script.dataset.suggestions || ''),
  };

  let sid = localStorage.getItem('cw_sid');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('cw_sid', sid);
  }

  const host = document.createElement('div');
  host.setAttribute('data-flipur-chat-host', '1');
  host.style.cssText =
    'position:fixed;right:0;bottom:0;z-index:2147483000;pointer-events:none;width:0;height:0;overflow:visible;';
  document.body.appendChild(host);

  const isDark = cfg.theme === 'dark';
  const bg = isDark ? '#121722' : '#fff';
  const bg2 = isDark ? '#0b0e14' : '#f4f6fb';
  const text = isDark ? '#e8ecf4' : '#1f2d3d';
  const muted = isDark ? '#8a94a8' : '#5c6b7a';
  const line = isDark ? 'rgba(255,255,255,.09)' : '#e6e9f0';
  const botBg = isDark ? '#1a2030' : '#fff';
  const chips = cfg.suggestions
    .map(
      (s) =>
        `<button type="button" class="chip" data-q="${esc(s.q)}">${esc(s.label)}</button>`,
    )
    .join('');

  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
  <style>
    *{box-sizing:border-box;font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif}
    .backdrop,.btn,.win{pointer-events:auto}
    .backdrop{
      position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,.35);opacity:0;
      transition:opacity .22s ease;pointer-events:none;
    }
    .backdrop.show{opacity:1;pointer-events:auto}
    .btn{
      position:fixed;
      right:max(18px,env(safe-area-inset-right,0px));
      bottom:max(18px,env(safe-area-inset-bottom,0px));
      width:58px;height:58px;border-radius:50%;
      background:${esc(cfg.color)};border:0;cursor:pointer;padding:4px;overflow:visible;
      box-shadow:0 8px 32px rgba(0,245,155,.25),0 4px 20px rgba(0,0,0,.45);
      display:flex;align-items:center;justify-content:center;
      transform:scale(1);transition:transform .15s ease,box-shadow .15s ease;
      z-index:2147483002;
    }
    .btn:hover{transform:scale(1.06)}
    .btn.open{transform:scale(.92)}
    .btn::after{
      content:'';position:absolute;inset:-4px;border-radius:50%;
      border:2px solid ${esc(cfg.color)};opacity:.45;animation:pulse 2.4s ease infinite;
    }
    @keyframes pulse{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.08);opacity:.6}}
    .btn.open::after{display:none}
    .btn img{width:100%;height:100%;border-radius:50%;object-fit:cover;background:${bg2}}
    .win{
      position:fixed;right:max(18px,env(safe-area-inset-right,0px));
      bottom:max(86px,calc(68px + env(safe-area-inset-bottom,0px)));width:384px;max-width:calc(100vw - 36px);
      height:min(580px,calc(100vh - 110px));background:${bg};border-radius:18px;
      border:1px solid ${line};
      box-shadow:0 20px 60px rgba(0,0,0,.55);display:flex;flex-direction:column;overflow:hidden;
      z-index:2147483003;
      transform:translateY(12px) scale(.96);opacity:0;pointer-events:none;
      transition:transform .28s cubic-bezier(.2,.9,.2,1),opacity .22s ease;
    }
    .win.open{transform:translateY(0) scale(1);opacity:1;pointer-events:auto}
    header{
      background:linear-gradient(135deg,${esc(cfg.color)} 0%,#00c97a 100%);
      color:#0b0e14;padding:14px 16px;font-weight:700;font-size:15px;
      display:flex;align-items:center;gap:10px;flex-shrink:0;
    }
    header img{width:34px;height:34px;border-radius:10px;object-fit:cover;box-shadow:0 2px 8px rgba(0,0,0,.2)}
    .head-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;line-height:1.2}
    .head-text strong{font-size:15px}
    .status{font-size:11px;font-weight:600;opacity:.85;display:flex;align-items:center;gap:6px}
    .dot{width:7px;height:7px;border-radius:50%;background:#0b0e14;box-shadow:0 0 0 2px rgba(11,14,20,.25)}
    .dot.on{background:#0b0e14;animation:dot 1.8s ease infinite}
    @keyframes dot{0%,100%{opacity:.65}50%{opacity:1}}
    .x{
      background:rgba(11,14,20,.15);border:0;width:32px;height:32px;border-radius:10px;
      cursor:pointer;font-size:18px;line-height:1;color:#0b0e14;
    }
    .msgs{
      flex:1;overflow-y:auto;padding:14px 14px 8px;display:flex;flex-direction:column;gap:10px;
      background:${bg2};scroll-behavior:smooth;
    }
    .m{
      max-width:88%;padding:11px 14px;border-radius:16px;font-size:14px;line-height:1.5;
      white-space:pre-wrap;word-wrap:break-word;animation:pop .25s ease;
    }
    @keyframes pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .bot{background:${botBg};color:${text};align-self:flex-start;border-bottom-left-radius:4px;
      border:1px solid ${line}}
    .me{background:${esc(cfg.color)};color:#0b0e14;align-self:flex-end;border-bottom-right-radius:4px;font-weight:600}
    .typing{color:${muted};font-size:13px;padding:4px 2px}
    .typing span{display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;
      background:${muted};animation:blink 1.2s infinite}
    .typing span:nth-child(2){animation-delay:.15s}
    .typing span:nth-child(3){animation-delay:.3s}
    @keyframes blink{0%,80%,100%{opacity:.25}40%{opacity:1}}
    .chips{
      display:flex;flex-wrap:nowrap;gap:8px;padding:0 14px 10px;background:${bg2};
      overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;
    }
    .chips::-webkit-scrollbar{display:none}
    .chip{
      font-size:12px;padding:7px 12px;border-radius:999px;border:1px solid ${line};
      background:${bg};color:${text};cursor:pointer;transition:background .15s,border-color .15s;
    }
    .chip:hover{border-color:${esc(cfg.color)};color:${esc(cfg.color)}}
    form{display:flex;gap:8px;padding:12px;border-top:1px solid ${line};background:${bg};flex-shrink:0}
    input{
      flex:1;border:1px solid ${line};border-radius:12px;padding:11px 14px;font-size:14px;
      outline:0;background:${isDark ? '#0b0e14' : '#fff'};color:${text};
    }
    input::placeholder{color:${muted}}
    input:focus{border-color:${esc(cfg.color)};box-shadow:0 0 0 2px rgba(0,245,155,.15)}
    form button{
      background:${esc(cfg.color)};color:#0b0e14;border:0;border-radius:12px;
      padding:0 14px;cursor:pointer;font-weight:700;min-width:48px;display:flex;align-items:center;justify-content:center;
    }
    form button:disabled{opacity:.6;cursor:wait}
    form button svg{display:block}
    .foot{font-size:10px;color:${muted};text-align:center;padding:6px 0 max(10px,env(safe-area-inset-bottom,0px));background:${bg}}
    @media (prefers-reduced-motion:reduce){
      .win,.backdrop,.btn,.m,.dot,.btn::after{animation:none!important;transition:none!important}
    }
  </style>
  <div class="backdrop" aria-hidden="true"></div>
  <button type="button" class="btn" aria-label="Open chat">${cfg.logo ? `<img src="${esc(cfg.logo)}" alt="">` : '💬'}</button>
  <div class="win" role="dialog" aria-modal="true" aria-label="${esc(cfg.title)}">
    <header>
      ${cfg.logo ? `<img src="${esc(cfg.logo)}" alt="">` : ''}
      <div class="head-text">
        <strong>${esc(cfg.title)}</strong>
        <span class="status"><span class="dot on"></span>Online</span>
      </div>
      <button type="button" class="x" aria-label="Close chat">×</button>
    </header>
    <div class="msgs"></div>
    <div class="chips">${chips}</div>
    <form>
      <input placeholder="Type a message…" maxlength="1000" required autocomplete="off">
      <button type="submit" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12L20 4l-2.5 16L11 13 4 12z" fill="currentColor"/></svg></button>
    </form>
    <div class="foot">Powered by Flipur Support</div>
  </div>`;

  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const backdrop = $('.backdrop');
  const win = $('.win');
  const btn = $('.btn');
  const msgs = $('.msgs');
  const input = $('input');
  const sendBtn = $('form button');
  let typingEl = null;

  const scroll = () => {
    msgs.scrollTop = msgs.scrollHeight;
  };

  const add = (text, who) => {
    if (typingEl) {
      typingEl.remove();
      typingEl = null;
    }
    const d = document.createElement('div');
    d.className = `m ${who}`;
    d.textContent = text;
    msgs.appendChild(d);
    scroll();
    return d;
  };

  const showTyping = () => {
    if (typingEl) return typingEl;
    typingEl = document.createElement('div');
    typingEl.className = 'typing bot';
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(typingEl);
    scroll();
    return typingEl;
  };

  const setOpen = (open) => {
    win.classList.toggle('open', open);
    backdrop.classList.toggle('show', open);
    btn.classList.toggle('open', open);
    if (open) {
      input.focus();
      scroll();
    }
  };

  add(cfg.welcome, 'bot');

  btn.onclick = () => setOpen(!win.classList.contains('open'));
  backdrop.onclick = () => setOpen(false);
  $('.x').onclick = () => setOpen(false);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    add(trimmed, 'me');
    sendBtn.disabled = true;
    showTyping();
    try {
      const endpoint = cfg.webhook || `${cfg.api.replace(/\/$/, '')}/api/chat`;
      const body = cfg.webhook
        ? { action: 'sendMessage', sessionId: sid, chatInput: trimmed }
        : { session: sid, message: trimmed };
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      const reply =
        data.output || data.text || data.reply || data.error || 'No response.';
      add(typeof reply === 'string' ? reply : JSON.stringify(reply), 'bot');
    } catch {
      add('Connection error. Please retry.', 'bot');
    } finally {
      sendBtn.disabled = false;
    }
  };

  $('form').onsubmit = (e) => {
    e.preventDefault();
    const text = input.value;
    input.value = '';
    sendMessage(text);
  };

  $$('.chip').forEach((chip) => {
    chip.onclick = () => sendMessage(chip.dataset.q || chip.textContent);
  });
})();