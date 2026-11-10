import { useEffect } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./auth";
import { Nav } from "./components/Nav";
import { Home } from "./components/Home";
import { Footer } from "./components/Footer";
import { Privacy, Terms } from "./components/Legal";

function ScrollToHash() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 86;
        window.scrollTo({ top, behavior: "auto" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  return null;
}

function NotFound() {
  return (
    <main className="w missing">
      <h1>Page not found</h1>
      <p className="lead">That address is not on Flipur.</p>
      <Link className="btn p" to="/">
        Back home
      </Link>
    </main>
  );
}

function Shell() {
  return (
    <>
      <ScrollToHash />
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
