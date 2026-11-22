import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

const NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/leads", label: "Leads" },
  { to: "/funnel", label: "Funnel" },
  { to: "/campaigns", label: "Campaigns" },
  { to: "/waitlist", label: "Waitlist" },
  { to: "/affiliate-master", label: "Affiliates" },
];

export function AdminLayout({ onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onKey(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="admin-app">
      <header className="admin-topbar">
        <Link className="logo" to="/">
          <img src="/logo.png" alt="" />
          Flipur<span> CRM</span>
        </Link>

        <nav className="admin-desktop-nav" aria-label="Admin">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "on" : undefined)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-topbar-actions">
          <button className="btn s sm desktop-only" type="button" onClick={onSignOut}>
            Sign out
          </button>
          <button
            className="hamburger"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="admin-drawer"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        className={menuOpen ? "admin-drawer-backdrop on" : "admin-drawer-backdrop"}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      <aside id="admin-drawer" className={menuOpen ? "admin-drawer on" : "admin-drawer"} aria-hidden={!menuOpen}>
        <div className="admin-drawer-head">
          <strong>Menu</strong>
          <button className="btn s sm" type="button" onClick={() => setMenuOpen(false)}>
            Close
          </button>
        </div>
        <nav className="admin-drawer-nav" aria-label="Mobile admin">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "on" : undefined)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="btn s drawer-signout" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
