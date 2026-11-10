import { useEffect } from "react";

const BOT_SCRIPT_ID = "messenger-widget-b";
const BOT_CONFIG = "6af313fda03f5eb0f8c18257,6af313b70a16f6ac61fb9e92,agent";
const LOADER_URL = "https://cdn.botpenguin.com/website-bot.js";

const COMPACT_STYLE_ID = "flipur-botpenguin-compact";

const BOT_MESSENGER_CSS = `
  #botpenguin-launcher-12, [id^="botpenguin-launcher"] {
    transform: scale(0.92) !important;
    transform-origin: bottom right !important;
    right: 16px !important;
    bottom: 16px !important;
    z-index: 9998 !important;
  }
  #BotPenguin-messenger, [id*="BotPenguin-messenger"] {
    width: min(360px, calc(100vw - 32px)) !important;
    max-width: 360px !important;
  height: min(575px, calc(100vh - 96px)) !important;
    max-height: min(78vh, calc(100vh - 96px)) !important;
    min-height: 420px !important;
    top: auto !important;
    right: 16px !important;
    bottom: 80px !important;
    left: auto !important;
    z-index: 9999 !important;
    overflow: hidden !important;
  }
`;

function injectCompactStyles() {
  let style = document.getElementById(COMPACT_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = COMPACT_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = BOT_MESSENGER_CSS;
}

function debugBotPenguin() {
  const key = localStorage.getItem("__BotPenguin");
  const user = localStorage.getItem("__BotPenguinUser");
  const launcher = document.getElementById("botpenguin-launcher-12");
  const root = document.querySelector("botpenguin-root");
  const messenger = document.getElementById("BotPenguin-messenger");

  const payload = {
    storageKey: key ? "set" : "missing",
    storageUser: user ? "set" : "missing",
    launcher: Boolean(launcher),
    root: Boolean(root),
    messenger: Boolean(messenger),
  };

  if (!root && !launcher) {
    console.warn(
      "[Flipur] BotPenguin did not appear after load. Whitelist https://flipur.trade and http://localhost:5173 in BotPenguin, disable ad blockers, and check Network for cdn.express-chat.com.",
      payload,
    );
    return;
  }

  injectCompactStyles();
  console.info("[Flipur] BotPenguin active (compact layout).", payload);
}

export function BotPenguin() {
  useEffect(() => {
    injectCompactStyles();

    if (document.querySelector("botpenguin-root")) {
      debugBotPenguin();
      return undefined;
    }

    let script = document.getElementById(BOT_SCRIPT_ID);
    if (!script) {
      script = document.createElement("script");
      script.id = BOT_SCRIPT_ID;
      script.src = LOADER_URL;
      script.defer = true;
      script.text = BOT_CONFIG;
      script.addEventListener("load", () => {
        console.info("[Flipur] BotPenguin loader downloaded.");
        window.setTimeout(debugBotPenguin, 4500);
        window.setTimeout(injectCompactStyles, 5200);
      });
      script.addEventListener("error", () => {
        console.error("[Flipur] BotPenguin loader failed (cdn.botpenguin.com).");
      });
      document.body.appendChild(script);
    } else if (!document.querySelector("botpenguin-root")) {
      window.setTimeout(debugBotPenguin, 4500);
    }

    const resizeTimer = window.setInterval(injectCompactStyles, 4000);

    return () => {
      window.clearInterval(resizeTimer);
    };
  }, []);

  return null;
}
