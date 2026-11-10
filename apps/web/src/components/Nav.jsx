import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="Flipur home">
      <img src="/logo.png" alt="" />
      <span className="mark">Flipur<span>.trade</span></span>
    </Link>
  );
}

export function Nav() {
  const { user, joined, leave } = useAuth();
  const location = useLocation();

  function goWaitlist(event) {
    if (location.pathname === "/" && location.hash === "#waitlist") {
      event.preventDefault();
      document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <nav className="top">
      <div className="w">
        <Logo />
        <div className="links">
          <Link to={{ pathname: "/", hash: "reel" }}>Reel</Link>
          <Link to={{ pathname: "/", hash: "features" }}>Features</Link>
          <Link to={{ pathname: "/", hash: "how" }}>How it works</Link>
          <Link to={{ pathname: "/", hash: "compat" }}>Compatibility</Link>
          <Link to={{ pathname: "/", hash: "faq" }}>FAQ</Link>
        </div>
        {joined && user ? (
          <div className="nav-auth">
            <span className="who">{user.displayName || user.email}</span>
            <button className="btn s sm" type="button" onClick={leave}>
              Sign out
            </button>
          </div>
        ) : (
          <Link className="btn p sm" to="/#waitlist" onClick={goWaitlist}>
            Join the waitlist
          </Link>
        )}
      </div>
    </nav>
  );
}
