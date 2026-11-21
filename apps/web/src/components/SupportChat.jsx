import { useEffect } from "react";

const SCRIPT_ID = "flipur-support-chat-sdk";

const CHAT_API =
  import.meta.env.VITE_SUPPORT_CHAT_API ||
  (import.meta.env.DEV ? "http://localhost:3000" : "https://my-bot.onrender.com");

const SDK_URL =
  import.meta.env.VITE_SUPPORT_CHAT_SDK_URL || "/support-widget/sdk.js?v=4";

const SUGGESTIONS =
  "Pricing:How much does Flipur Pro cost?|Install:How do I install Flipur?|Platforms:Which platforms does Flipur support?|Billing:How do I cancel or manage billing?";

export function SupportChat() {
  useEffect(() => {
    if (document.querySelector("[data-flipur-chat-host]")) return undefined;

    let script = document.getElementById(SCRIPT_ID);
    if (script) script.remove();

    const logo = `${window.location.origin}/logo.png`;

    script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SDK_URL;
    script.setAttribute("data-title", "Flipur Support");
    script.setAttribute("data-logo", logo);
    script.setAttribute("data-api", CHAT_API);
    script.setAttribute("data-theme", "dark");
    script.setAttribute("data-welcome", "Hey — ask about install, Pro, billing, or supported platforms.");
    script.setAttribute("data-color", "#00f59b");
    script.setAttribute("data-suggestions", SUGGESTIONS);
    script.addEventListener("load", () => {
      console.info("[Flipur] Support chat widget loaded.", { sdk: SDK_URL, api: CHAT_API });
    });
    script.addEventListener("error", () => {
      console.error("[Flipur] Support chat widget failed to load.", SDK_URL);
    });
    document.body.appendChild(script);

    return () => {
      document.querySelector("[data-flipur-chat-host]")?.remove();
      document.getElementById(SCRIPT_ID)?.remove();
    };
  }, []);

  return null;
}