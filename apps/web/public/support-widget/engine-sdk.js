/*!
 * Chat Widget SDK — vanilla JS, zero dependencies, ~8 KB.
 *
 * Embed:
 *   <script src="https://YOUR-APP.vercel.app/widget/sdk.js"
 *           data-bot-id="00000000-0000-0000-0000-000000000000" defer></script>
 *
 * Optional attributes:
 *   data-position="right|left"   data-color="#4f46e5"   data-title="Support"
 *   data-greeting="Hi there!"    data-base-url="https://YOUR-APP.vercel.app"
 *
 * Optional JS API:  window.ChatWidget.open() / .close() / .toggle()
 *
 * Design notes
 *  - Rendered inside a Shadow DOM: the host page's CSS can't break the widget
 *    and the widget's CSS can't leak into the host page.
 *  - Styling uses Tailwind's design tokens (slate scale, rounded-2xl, shadow-2xl)
 *    written out as plain CSS. Shipping the Tailwind runtime/CDN to third-party
 *    sites would add ~300 KB and global style side effects; this is the same look
 *    at a fraction of the weight.
 *  - Bot/visitor text is always inserted with textContent (never innerHTML), so
 *    model output can't inject markup into the host page.
 */
(function () {
  "use strict";
  if (window.__chatWidgetLoaded) return;
  window.__chatWidgetLoaded = true;

  var script = document.currentScript || document.getElementById("flipur-support-chat-sdk");
  if (!script) {
    var tags = document.querySelectorAll("script[src*='widget/sdk.js'],script[src*='engine-sdk.js'],script[src*='support-widget']");
    script = tags[tags.length - 1];
  }
  if (!script) return console.error("[ChatWidget] script tag not found");

  var webhookUrl = (script.getAttribute("data-webhook") || "").replace(/\s+/g, "");
  var botId = script.getAttribute("data-bot-id") || (webhookUrl ? "n8n" : "");
  if (!botId && script.src) {
    try { botId = new URL(script.src, location.href).searchParams.get("bot"); } catch (e) { botId = ""; }
  }
  if (!botId && !webhookUrl) return console.error("[ChatWidget] missing bot id");

  var apiBase = (script.getAttribute("data-base-url") || script.getAttribute("data-api-base") || (script.src ? new URL(script.src, location.href).origin : "")).replace(/\/$/, "");
  var configEndpoint = webhookUrl ? "" : apiBase + "/api/v1/widget/" + encodeURIComponent(botId) + "/config";
  var chatEndpoint = webhookUrl || (apiBase + "/api/v1/widget/" + encodeURIComponent(botId) + "/chat");
  var position = script.getAttribute("data-position") === "left" ? "left" : "right";

  function stripMarkdown(text) {
    return String(text == null ? "" : text)
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/\*([^*\n]+)\*/g, "$1")
      .replace(/_([^_\n]+)_/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^\s*[-*]\s+/gm, "• ");
  }

  // ---------------------------------------------------------------- storage --
  // Wrapped in try/catch: Safari private mode & blocked-cookie setups throw.
  function store(kind) {
    return {
      get: function (k) { try { return window[kind].getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { window[kind].setItem(k, v); } catch (e) { /* ignore */ } },
    };
  }
  var local = store("localStorage");
  var session = store("sessionStorage");

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 3) | 8).toString(16);
    });
  }

  var sessionKey = "cw_session_" + botId;
  var sessionId = local.get(sessionKey);
  if (!sessionId) { sessionId = uuid(); local.set(sessionKey, sessionId); }

  var historyKey = "cw_history_" + botId;
  var history = [];
  try { history = JSON.parse(session.get(historyKey) || "[]"); } catch (e) { history = []; }
  var appliedAssistants = history.filter(function (m) { return m.role === "bot"; }).length;

  // ----------------------------------------------------------------- styles --
  var CSS = "\
:host{all:initial}\
*,*::before,*::after{box-sizing:border-box}\
.root{--accent:#4f46e5;position:fixed;bottom:20px;z-index:2147483000;\
font:14px/1.5 ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#0f172a}\
.root.right{right:20px}.root.left{left:20px}\
button{font:inherit;cursor:pointer;border:0;background:none;color:inherit}\
.launcher{width:56px;height:56px;border-radius:9999px;background:var(--accent);color:#fff;display:grid;place-items:center;\
box-shadow:0 10px 25px -5px rgba(15,23,42,.35);transition:transform .15s ease}\
.launcher:hover{transform:scale(1.06)}\
.launcher:focus-visible,.send:focus-visible,.close:focus-visible{outline:2px solid #0f172a;outline-offset:2px}\
.launcher svg{width:26px;height:26px}\
.panel{position:absolute;bottom:72px;width:380px;max-width:calc(100vw - 40px);height:min(600px,calc(100vh - 110px));\
display:flex;flex-direction:column;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;\
box-shadow:0 25px 50px -12px rgba(15,23,42,.3);opacity:0;transform:translateY(8px);visibility:hidden;\
transition:opacity .18s ease,transform .18s ease,visibility .18s}\
.right .panel{right:0}.left .panel{left:0}\
.root.open .panel{opacity:1;transform:none;visibility:visible}\
.head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 16px;background:var(--accent);color:#fff}\
.title{font-weight:600;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\
.sub{font-size:12px;opacity:.85}\
.close{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;color:#fff}\
.close:hover{background:rgba(255,255,255,.18)}\
.msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f8fafc;scroll-behavior:smooth}\
.m{max-width:82%;padding:9px 13px;border-radius:16px;white-space:pre-wrap;overflow-wrap:anywhere}\
.m a{color:inherit;text-decoration:underline;text-underline-offset:2px;font-weight:600}\
.m.bot a{color:var(--accent)}\
.m.user a{color:#fff}\
.m.bot{align-self:flex-start;background:#fff;border:1px solid #e2e8f0;border-bottom-left-radius:4px}\
.m.user{align-self:flex-end;background:var(--accent);color:#fff;border-bottom-right-radius:4px}\
.m.err{align-self:center;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;font-size:13px}\
.typing{display:flex;gap:4px;padding:12px 14px}\
.typing i{width:6px;height:6px;border-radius:9999px;background:#94a3b8;animation:b 1.1s infinite ease-in-out}\
.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}\
@keyframes b{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}\
.chips{display:flex;flex-wrap:wrap;gap:8px;padding:0 12px 10px;background:#fff;border-top:1px solid #e2e8f0}\
.chip{padding:6px 12px;border-radius:9999px;border:1px solid #cbd5e1;background:#f8fafc;color:#0f172a;\
font-size:12px;font-weight:600;line-height:1.2;transition:border-color .15s,background .15s,color .15s}\
.chip:hover{border-color:var(--accent);color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,#fff)}\
.chip:disabled{opacity:.45;cursor:not-allowed}\
.foot{display:flex;align-items:flex-end;gap:8px;padding:10px;border-top:0;background:#fff}\
textarea{flex:1;resize:none;border:1px solid #cbd5e1;border-radius:12px;padding:9px 12px;font:inherit;color:inherit;\
max-height:96px;outline:none;background:#fff}\
textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent)}\
.send{width:40px;height:40px;border-radius:12px;background:var(--accent);color:#fff;display:grid;place-items:center;flex:none}\
.send:disabled{opacity:.45;cursor:not-allowed}\
.note{padding:0 12px 8px;background:#fff;font-size:11px;color:#64748b;text-align:center}\
.root.dark{color:#e2e8f0}\
.dark .panel{background:#0f172a;border-color:#334155}\
.dark .msgs{background:#020617}\
.dark .m.bot{background:#1e293b;border-color:#334155;color:#e2e8f0}\
.dark .m.err{background:#450a0a;border-color:#7f1d1d;color:#fecaca}\
.dark .chips{background:#0f172a;border-top-color:#334155}\
.dark .chip{background:#1e293b;border-color:#334155;color:#e2e8f0}\
.dark .chip:hover{border-color:var(--accent);color:var(--accent);background:color-mix(in srgb,var(--accent) 16%,#0f172a)}\
.dark .foot{background:#0f172a;border-top-color:#334155}\
.dark textarea{background:#020617;color:#e2e8f0;border-color:#334155}\
.dark .note{background:#0f172a;color:#94a3b8}\
@media (max-width:480px){.root{bottom:0}.root.right{right:0}.root.left{left:0}\
.launcher{margin:0 16px 16px auto;display:grid}.left .launcher{margin:0 auto 16px 16px}\
.panel{position:fixed;inset:0;width:100%;max-width:none;height:100%;border-radius:0;border:0}\
.root.open .launcher{display:none}}\
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}";

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var ICON_CLOSE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_SEND = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>';

  // ------------------------------------------------------------------- DOM --
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  var host = el("div");
  host.id = "chat-widget-host";
  var shadow = host.attachShadow({ mode: "open" });
  var style = el("style"); style.textContent = CSS;

  var root = el("div", "root " + position);
  var panel = el("div", "panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chat assistant");

  var head = el("div", "head");
  var headText = el("div");
  var titleEl = el("div", "title", script.getAttribute("data-title") || "Assistant");
  headText.appendChild(titleEl);
  headText.appendChild(el("div", "sub", "AI assistant"));
  var closeBtn = el("button", "close"); closeBtn.innerHTML = ICON_CLOSE; closeBtn.setAttribute("aria-label", "Close chat");
  head.appendChild(headText); head.appendChild(closeBtn);

  var msgs = el("div", "msgs");
  msgs.setAttribute("role", "log");
  msgs.setAttribute("aria-live", "polite");

  function parseSuggestions(raw) {
    if (!raw) {
      return [
        { label: "Pricing", q: "How much does Flipur Pro cost?" },
        { label: "Install", q: "How do I install Flipur?" },
        { label: "Platforms", q: "Which platforms does Flipur support?" },
        { label: "Free trial", q: "How many free flips do I get with Flipur?" },
      ];
    }
    return raw.split("|").map(function (part) {
      var bits = part.split(":").map(function (s) { return s.trim(); });
      var label = bits[0] || "";
      var q = bits.slice(1).join(":").trim() || label;
      return { label: label || q, q: q };
    }).filter(function (s) { return s.label && s.q; }).slice(0, 4);
  }

  var suggestions = parseSuggestions(script.getAttribute("data-suggestions") || "");
  var chips = el("div", "chips");
  chips.setAttribute("aria-label", "Suggested questions");
  var chipButtons = suggestions.map(function (s) {
    var btn = el("button", "chip", s.label);
    btn.type = "button";
    btn.setAttribute("data-q", s.q);
    btn.setAttribute("aria-label", "Ask: " + s.q);
    chips.appendChild(btn);
    return btn;
  });

  var foot = el("div", "foot");
  var input = el("textarea");
  input.rows = 1; input.placeholder = "Type your message…"; input.maxLength = 2000;
  input.setAttribute("aria-label", "Message");
  var sendBtn = el("button", "send"); sendBtn.innerHTML = ICON_SEND; sendBtn.setAttribute("aria-label", "Send message");
  foot.appendChild(input); foot.appendChild(sendBtn);

  panel.appendChild(head); panel.appendChild(msgs); panel.appendChild(chips); panel.appendChild(foot);
  panel.appendChild(el("div", "note", "Powered by FlipUR Trade"));

  var launcher = el("button", "launcher"); launcher.innerHTML = ICON_CHAT;
  launcher.setAttribute("aria-label", "Open chat"); launcher.setAttribute("aria-expanded", "false");

  root.appendChild(panel); root.appendChild(launcher);
  shadow.appendChild(style); shadow.appendChild(root);

  // ----------------------------------------------------------------- state --
  var isOpen = false;
  var busy = false;
  var greeting = script.getAttribute("data-greeting") || "Hi! How can I help you today?";

  function scrollDown() { msgs.scrollTop = msgs.scrollHeight; }

  function fillWithLinks(node, text) {
    var raw = String(text == null ? "" : text);
    var re = /(https?:\/\/[^\s<>"']+)/g;
    var last = 0;
    var match;
    node.textContent = "";
    while ((match = re.exec(raw))) {
      if (match.index > last) {
        node.appendChild(document.createTextNode(raw.slice(last, match.index)));
      }
      var href = match[1].replace(/[.,;:!?)\]}]+$/g, "");
      var trailing = match[1].slice(href.length);
      if (/^https?:\/\//i.test(href)) {
        var a = document.createElement("a");
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = href;
        node.appendChild(a);
      } else {
        node.appendChild(document.createTextNode(match[1]));
      }
      if (trailing) node.appendChild(document.createTextNode(trailing));
      last = match.index + match[1].length;
    }
    if (last < raw.length) node.appendChild(document.createTextNode(raw.slice(last)));
  }

  function addMessage(role, text, persist) {
    var clean = role === "bot" || role === "err" ? stripMarkdown(text) : text;
    var m = el("div", "m " + role);
    fillWithLinks(m, clean);
    msgs.appendChild(m);
    scrollDown();
    if (persist) {
      history.push({ role: role, text: clean });
      history = history.slice(-40);
      session.set(historyKey, JSON.stringify(history));
    }
    return m;
  }

  function showTyping() {
    var t = el("div", "m bot typing");
    t.setAttribute("aria-label", "Assistant is typing");
    t.appendChild(el("i")); t.appendChild(el("i")); t.appendChild(el("i"));
    msgs.appendChild(t); scrollDown();
    return t;
  }

  function setOpen(next) {
    isOpen = next;
    root.classList.toggle("open", next);
    launcher.innerHTML = next ? ICON_CLOSE : ICON_CHAT;
    launcher.setAttribute("aria-expanded", String(next));
    launcher.setAttribute("aria-label", next ? "Close chat" : "Open chat");
    if (next) setTimeout(function () { input.focus(); }, 60);
  }

  function setBusy(next) {
    busy = next;
    sendBtn.disabled = next;
    chipButtons.forEach(function (btn) { btn.disabled = next; });
  }

  async function send(preset) {
    var text = (typeof preset === "string" ? preset : input.value).trim();
    if (!text || busy) return;

    input.value = ""; autosize();
    addMessage("user", text, true);
    setBusy(true);
    var typing = showTyping();

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 60000);

    try {
      var payload = webhookUrl
        ? { action: "sendMessage", sessionId: sessionId, chatInput: text }
        : { message: text, sessionId: sessionId };
      var res = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      var data = await res.json().catch(function () { return {}; });
      typing.remove();

      if (webhookUrl) {
        if (res.ok) {
          var reply = data.output || data.text || data.reply || data.error || "No response.";
          addMessage("bot", typeof reply === "string" ? reply : JSON.stringify(reply), true);
        } else if (res.status === 429) {
          addMessage("err", data.error || "You're sending messages too quickly. Wait a moment and try again.");
        } else {
          addMessage("err", data.error || "Something went wrong. Please try again.");
        }
      } else if (res.ok && data.handover && !data.reply) {
        addMessage("bot", "A teammate will reply here shortly.", false);
      } else if (res.ok) {
        await refreshAssistants();
      } else if (res.status === 429) {
        addMessage("err", data.error || "You're sending messages too quickly. Wait a moment and try again.");
      } else {
        addMessage("err", data.error || "Something went wrong. Please try again.");
      }
    } catch (e) {
      typing.remove();
      addMessage("err", e && e.name === "AbortError"
        ? "The assistant took too long to respond. Please try again."
        : "Can't reach the assistant. Check your connection and try again.");
    } finally {
      clearTimeout(timer);
      setBusy(false);
      input.focus();
    }
  }

  function autosize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 96) + "px";
  }

  // ---------------------------------------------------------------- events --
  launcher.addEventListener("click", function () { setOpen(!isOpen); });
  closeBtn.addEventListener("click", function () { setOpen(false); launcher.focus(); });
  sendBtn.addEventListener("click", function () { send(); });
  chipButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      send(btn.getAttribute("data-q") || btn.textContent || "");
    });
  });
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); }
  });
  panel.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { setOpen(false); launcher.focus(); }
  });

  // ------------------------------------------------------------------ boot --
  // Fetch public config first. If the origin isn't allow-listed (or the bot is
  // disabled) the request fails and we silently render nothing on the host page.
  function mount() {
    document.body.appendChild(host);
    if (history.length) history.forEach(function (m) { addMessage(m.role, m.text, false); });
    else addMessage("bot", greeting, false);
  }

  var refreshTail = Promise.resolve();
  function refreshAssistants() {
    if (webhookUrl) return Promise.resolve();
    var run = refreshTail.then(function () {
      return fetch(chatEndpoint + "?sessionId=" + encodeURIComponent(sessionId))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data || !data.messages) return;
          var assistants = data.messages.filter(function (m) { return m.role === "assistant"; });
          for (var i = appliedAssistants; i < assistants.length; i++) addMessage("bot", assistants[i].content, true);
          if (assistants.length > appliedAssistants) appliedAssistants = assistants.length;
        });
    });
    refreshTail = run.catch(function () {});
    return run;
  }
  if (!webhookUrl) setInterval(function () { refreshAssistants(); }, 4000);

  function rgbOf(value) {
    var match = String(value || "").match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/);
    if (!match) return null;
    if (match[4] !== undefined && Number(match[4]) === 0) return null;
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  function channelLum(rgb) {
    return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  }
  function saturation(rgb) {
    var max = Math.max(rgb[0], rgb[1], rgb[2]);
    var min = Math.min(rgb[0], rgb[1], rgb[2]);
    return max === 0 ? 0 : (max - min) / max;
  }
  function toHex(rgb) {
    return "#" + rgb.map(function (n) { return n.toString(16).padStart(2, "0"); }).join("");
  }
  function pageBackground() {
    var nodes = [document.body, document.documentElement];
    for (var i = 0; i < nodes.length; i++) {
      if (!nodes[i]) continue;
      var parsed = rgbOf(getComputedStyle(nodes[i]).backgroundColor);
      if (parsed) return parsed;
    }
    return [255, 255, 255];
  }
  function pageAccent(bg) {
    var meta = document.querySelector('meta[name="theme-color"]');
    var declared = meta && (meta.getAttribute("content") || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(declared || "")) return declared;
    var best = null;
    var bestScore = 0.25;
    var nodes = document.querySelectorAll("button, a, [role='button']");
    var limit = Math.min(nodes.length, 40);
    for (var i = 0; i < limit; i++) {
      var style = getComputedStyle(nodes[i]);
      var candidate = rgbOf(style.backgroundColor) || rgbOf(style.color);
      if (!candidate) continue;
      var score = saturation(candidate);
      if (score > bestScore && Math.abs(channelLum(candidate) - channelLum(bg)) > 0.12) {
        bestScore = score;
        best = candidate;
      }
    }
    return best ? toHex(best) : "";
  }
  function paintHostTheme(forcedAccent) {
    var bg = pageBackground();
    var dark = channelLum(bg) < 0.45;
    var accent = forcedAccent || pageAccent(bg) || (dark ? "#818cf8" : "#4f46e5");
    root.classList.toggle("dark", dark);
    if (/^#[0-9a-f]{6}$/i.test(accent)) root.style.setProperty("--accent", accent);
  }
  function applyTheme(mode, themeColor) {
    var forced = script.getAttribute("data-color");
    if (mode === "custom" && /^#[0-9a-f]{6}$/i.test(themeColor || "")) {
      root.classList.remove("dark");
      root.style.setProperty("--accent", themeColor);
      return;
    }
    paintHostTheme(/^#[0-9a-f]{6}$/i.test(forced || "") ? forced : "");
    if (window.matchMedia) {
      var query = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function () { paintHostTheme(/^#[0-9a-f]{6}$/i.test(forced || "") ? forced : ""); };
      if (query.addEventListener) query.addEventListener("change", onChange);
    }
  }

  if (webhookUrl) {
    applyTheme("", script.getAttribute("data-color") || "#00f59b");
    mount();
  } else {
    fetch(configEndpoint, { method: "GET" })
      .then(function (r) { if (!r.ok) throw new Error("config " + r.status); return r.json(); })
      .then(function (cfg) {
        if (!script.getAttribute("data-title") && cfg.name) titleEl.textContent = cfg.name;
        if (!script.getAttribute("data-greeting") && cfg.welcomeMessage) greeting = cfg.welcomeMessage;
        applyTheme(cfg.themeMode, cfg.themeColor);
        mount();
      })
      .catch(function (e) { console.warn("[ChatWidget] not loaded:", e.message); });
  }

  window.ChatWidget = {
    open: function () { setOpen(true); },
    close: function () { setOpen(false); },
    toggle: function () { setOpen(!isOpen); },
  };
})();
