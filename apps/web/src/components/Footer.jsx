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
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
        <p className="disc">
          Trading involves substantial risk of loss. Flipur is a psychological software tool, not financial advice, and is not affiliated with TopstepX, TradingView or any prop firm. Use at your own risk.
        </p>
      </div>
    </footer>
  );
}
