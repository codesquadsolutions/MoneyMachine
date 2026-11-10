import { useEffect } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { SEO, useSeo } from "./seo";
import { AuthProvider } from "./auth";
import { Nav } from "./components/Nav";
import { BotPenguin } from "./components/BotPenguin";
import { Home } from "./components/Home";
import { Footer } from "./components/Footer";
import { Privacy, Terms } from "./components/Legal";
import { ReelPage } from "./pages/ReelPage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { PlatformsPage } from "./pages/PlatformsPage";
import { FaqPage } from "./pages/FaqPage";
import { PricingPage } from "./pages/PricingPage";
import { AffiliateRoutes } from "./affiliate/AffiliateRoutes.jsx";
import { CheckoutSuccess } from "./components/CheckoutSuccess.jsx";
import { captureReferralFromSearch } from "./lib/referral.js";

const LEGACY_HASH_ROUTES = {
  reel: "/reel",
  features: "/features",
  how: "/how-it-works",
  compat: "/platforms",
  faq: "/faq",
};

function ScrollToHash() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const id = location.hash.replace(/^#/, "");
    if (location.pathname === "/" && id && LEGACY_HASH_ROUTES[id]) {
      navigate(LEGACY_HASH_ROUTES[id], { replace: true });
      return;
    }
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 86;
        window.scrollTo({ top, behavior: "auto" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash, navigate]);

  return null;
}

function NotFound() {
  const location = useLocation();
  useSeo({ ...SEO.notFound, path: location.pathname, robots: "noindex, follow" });
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
  const location = useLocation();
  const isAffiliate = location.pathname.startsWith("/affiliate");

  useEffect(() => {
    captureReferralFromSearch(location.search);
  }, [location.search]);

  return (
    <>
      <ScrollToHash />
      {!isAffiliate ? <Nav /> : null}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reel" element={<ReelPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/platforms" element={<PlatformsPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/affiliate/*" element={<AffiliateRoutes />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAffiliate ? <Footer /> : null}
      <BotPenguin />
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
