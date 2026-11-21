import { Link } from "react-router-dom";
import { ADD_TO_CHROME_LABEL, hasChromeWebStoreUrl, chromeWebStoreUrl } from "../content/download";

export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="Flipur home">
      <img src="/logo.png" alt="" width={34} height={34} decoding="async" />
      <span className="mark">Flipur<span>.trade</span></span>
    </Link>
  );
}

export function Nav() {
  const store = chromeWebStoreUrl();

  return (
    <nav className="top" aria-label="Main">
      <div className="w">
        <Logo />
        <div className="links">
          <Link to="/reel">Reel</Link>
          <Link to="/features">Features</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/platforms">Platforms</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/pricing" className="nav-muted">
            Pro pricing
          </Link>
          <Link to="/support" className="nav-muted">
            Support
          </Link>
        </div>
        {hasChromeWebStoreUrl() ? (
          <a className="btn p sm" href={store} target="_blank" rel="noopener noreferrer">
            {ADD_TO_CHROME_LABEL}
          </a>
        ) : (
          <Link className="btn p sm" to={{ pathname: "/", hash: "download" }}>
            {ADD_TO_CHROME_LABEL}
          </Link>
        )}
      </div>
    </nav>
  );
}
