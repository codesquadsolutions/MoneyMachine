import { Link } from "react-router-dom";
import { Logo } from "./Nav";

export function Footer() {
  return (
    <footer>
      <div className="w">
        <Logo />
        <div className="fl">
          <a href="https://www.instagram.com/flipurtrade" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <Link to="/reel">Reel</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/affiliate/register">Affiliates</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
        <p className="disc">
          Trading involves substantial risk of loss. Flipur is a psychological software tool, not financial advice, and is not affiliated with ProjectX, Delta Exchange, TradingView, Match-Trader, or any prop firm. Use at your own risk.
        </p>
      </div>
    </footer>
  );
}
