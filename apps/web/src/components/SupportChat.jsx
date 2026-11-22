import { useEffect } from "react";

const SCRIPT_ID = "flipur-support-chat-sdk";

const WEBHOOK_URL =
  import.meta.env.VITE_SUPPORT_CHAT_WEBHOOK_URL ||
  "https://n8n.codesquadsolutions.com/webhook/54827097-2aa9-4332-bf43-323b29c99b75/chat";

const SDK_URL =
  import.meta.env.VITE_SUPPORT_CHAT_SDK_URL || "/support-widget/engine-sdk.js";

export function SupportChat() {
  useEffect(() => {
    if (window.__chatWidgetLoaded || document.getElementById("chat-widget-host")) {
      return undefined;
    }

    let script = document.getElementById(SCRIPT_ID);
    if (script) script.remove();

    script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SDK_URL;
    script.defer = true;
    script.setAttribute("data-webhook", WEBHOOK_URL);
    script.setAttribute("data-bot-id", "n8n-flipur");
    script.setAttribute("data-title", "Flipur Support");
    script.setAttribute("data-color", "#00f59b");
    script.setAttribute(
      "data-greeting",
      "Hey — ask about install, Pro, billing, or supported platforms.",
    );
    script.setAttribute(
      "data-suggestions",
      [
        "Pricing:How much does Flipur Pro cost?",
        "Install:How do I install Flipur?",
        "Platforms:Which platforms does Flipur support?",
        "Free trial:How many free flips do I get with Flipur?",
      ].join("|"),
    );
    script.addEventListener("load", () => {
      console.info("[Flipur] Support chat widget loaded.", {
        sdk: SDK_URL,
        webhook: WEBHOOK_URL,
      });
    });
    script.addEventListener("error", () => {
      console.error("[Flipur] Support chat widget failed to load.", SDK_URL);
    });
    document.body.appendChild(script);

    return () => {
      document.getElementById(SCRIPT_ID)?.remove();
    };
  }, []);

  return null;
}
