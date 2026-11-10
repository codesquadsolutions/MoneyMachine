import { Link } from "react-router-dom";

export function CheckoutSuccess() {
  return (
    <main className="w missing">
      <h1>Thanks for subscribing</h1>
      <p className="lead">If payment succeeded, access will unlock shortly via email. Contact support if anything looks wrong.</p>
      <Link className="btn p" to="/">
        Back home
      </Link>
    </main>
  );
}
