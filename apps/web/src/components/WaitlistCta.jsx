import { WaitlistForm } from "./WaitlistForm";

export function WaitlistCta({ title = "Stop second-guessing your entries.", subtitle }) {
  return (
    <section className="page-cta">
      <div className="w">
        <div className="final">
          <h2>{title}</h2>
          <p className="sub">{subtitle || "Join the waitlist. We email you the install link when Flipur is ready."}</p>
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
