import { Link } from "react-router-dom";
import { usePageTitle } from "../usePageTitle";

export function Privacy() {
  usePageTitle("Privacy Policy – Flipur.trade");
  return (
    <main className="w legal">
      <h1>Privacy Policy</h1>
      <p>Last updated October 31, 2026.</p>
      <p className="note">
        This is a starter policy written for the Flipur site and waitlist. Read it and change anything that does not match how you operate before you rely on it. It is not legal advice.
      </p>
      <h2>What Flipur is</h2>
      <p>
        Flipur is a Chrome extension that flips the side and order type of an order you place on a supported trading site, before that order is sent. This website explains the product and collects a waitlist so we can email the install link. Flipur is not a broker and does not give financial advice.
      </p>
      <h2>What the website stores</h2>
      <p>If you join the waitlist with Google, we store:</p>
      <ul>
        <li>Your Google account email address</li>
        <li>The name and profile photo URL Google shares with the sign-in</li>
        <li>The platform you pick: TopstepX, TradingView, or both</li>
        <li>The time you joined</li>
      </ul>
      <p>
        We use that email to send the install link when Flipur is ready. We do not sell the list. Sign-in and storage run on Firebase, which is a Google service. The product reel is embedded from Instagram, so Instagram may receive your IP address when that player loads.
      </p>
      <h2>What the extension handles</h2>
      <p>
        The extension acts in your browser on supported order requests. It is built to change the order you chose to place, not to open an account for you or to move funds. Check the permissions it requests before you install it.
      </p>
      <h2>Leaving the list</h2>
      <p>
        Sign out ends the session in this browser. Your waitlist entry stays so we can send the install link. The person who operates this Firebase project can delete your waitlist document if you ask them to.
      </p>
      <p>
        <Link to="/">Back to Flipur</Link>
      </p>
    </main>
  );
}

export function Terms() {
  usePageTitle("Terms of Service – Flipur.trade");
  return (
    <main className="w legal">
      <h1>Terms of Service</h1>
      <p>Last updated October 31, 2026.</p>
      <p className="note">
        These are starter terms for the Flipur website and the extension described here. Review them before you publish. They are not legal advice.
      </p>
      <h2>The product</h2>
      <p>
        Flipur is psychological software. It flips the side and order type of orders you place in your browser on supported platforms. It is not a broker, not a signal service, and not financial, investment, or trading advice. It is not affiliated with TopstepX, TradingView, or any prop firm.
      </p>
      <h2>Availability</h2>
      <p>
        Joining the waitlist means you ask us to email you when you can install Flipur. Joining does not reserve a copy, create a paid subscription, or set an install date.
      </p>
      <h2>Your orders</h2>
      <p>
        You are responsible for every order placed from your account. Trading involves substantial risk of loss. Test on a practice or paper account first, and check that your firm's rules allow a browser extension to change an order before it is sent. If Flipur does not recognise an order, it is designed to send that order unchanged.
      </p>
      <h2>The site</h2>
      <p>
        We may change the site, the waitlist, and these terms. The site is provided as available. If you do not agree with these terms, do not join the waitlist.
      </p>
      <p>
        <Link to="/">Back to Flipur</Link>
      </p>
    </main>
  );
}
