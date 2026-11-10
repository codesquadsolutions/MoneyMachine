import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { ADD_TO_CHROME_LABEL, hasChromeWebStoreUrl, chromeWebStoreUrl } from "../content/download";

export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="Flipur home">
      <img src="/logo.png" alt="" />
      <span className="mark">Flipur<span>.trade</span></span>
    </Link>
  );
}

export function Nav() {
  const { user, leave } = useAuth();
  const store = chromeWebStoreUrl();

  return (
    <nav className="top">
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
        </div>
        {user ? (
          <div className="nav-auth">
            <span className="who">{user.displayName || user.email}</span>
            <button className="btn s sm" type="button" onClick={leave}>
              Sign out
            </button>
          </div>
        ) : hasChromeWebStoreUrl() ? (
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
