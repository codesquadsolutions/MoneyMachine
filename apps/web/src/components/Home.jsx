import { useMemo } from "react";
import { Link } from "react-router-dom";
import { buildSoftwareApplicationJsonLd, SEO, useSeo } from "../seo";
import { NeonMark } from "./NeonMark";
import { PlatformBar } from "./PlatformBar";
import { DownloadForm } from "./DownloadForm";
import { ADD_TO_CHROME_LABEL, FREE_FLIP_LIMIT } from "../content/download";

export function Home() {
  const jsonLd = useMemo(() => [buildSoftwareApplicationJsonLd()], []);
  useSeo({ ...SEO.home, path: "/", jsonLd });

  return (
    <main id="top">
      <div className="w hero">
        <div className="rv">
          <span className="pill">Chrome extension for traders</span>
          <h1>
            Your analysis isn't wrong. <em>Your order placing is.</em>
          </h1>
          <p className="lead">
            Use Flipur to flip your trade. It sits in your browser and flips the side and order type of every order you place — a buy limit becomes a sell stop at the exact same price. Start with {FREE_FLIP_LIMIT} free flips; one Pro subscription covers every platform your account is connected to.
          </p>
          <div className="cta">
            <a className="btn p" href="#download">
              {ADD_TO_CHROME_LABEL}
            </a>
            <Link className="btn s" to="/reel">
              Watch the reel
            </Link>
            <Link className="btn s" to="/how-it-works">
              See how it works
            </Link>
          </div>
          <DownloadForm />
        </div>
        <div className="vis">
          <NeonMark />
          <div className="flip" role="img" aria-label="Buy limit at 100.34 becomes sell stop at 100.34">
            <div>
              <small>You place</small>
              <b className="buy">BUY LIMIT</b>
              <small>100.34</small>
            </div>
            <i aria-hidden="true">→</i>
            <div>
              <small>Flipur sends</small>
              <b className="sell">SELL STOP</b>
              <small>100.34</small>
            </div>
          </div>
        </div>
      </div>
      <PlatformBar />
      <section className="home-links">
        <div className="w">
          <h2 className="home-links-title">Explore Flipur</h2>
          <div className="home-links-grid">
            <Link className="card home-link-card" to="/reel">
              <h3>What Flipur is</h3>
              <p>Watch the reel and hear why we built it.</p>
            </Link>
            <Link className="card home-link-card" to="/features">
              <h3>Features</h3>
              <p>Instant flips, exact prices, mirrored brackets, and more.</p>
            </Link>
            <Link className="card home-link-card" to="/how-it-works">
              <h3>How it works</h3>
              <p>Three steps, flip rules, and the interactive demo.</p>
            </Link>
            <Link className="card home-link-card" to="/platforms">
              <h3>Platforms</h3>
              <p>One subscription on every web trading platform we support.</p>
            </Link>
            <Link className="card home-link-card" to="/faq">
              <h3>FAQ</h3>
              <p>Free trial, prop firms, browsers, and support.</p>
            </Link>
            <Link className="card home-link-card" to="/pricing">
              <h3>Pro pricing</h3>
              <p>Only after your free flips—monthly or yearly plans.</p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
