import { platforms } from "../content/marketing";

export function PlatformBar() {
  return (
    <div className="bar">
      <div className="w platforms">
        <p className="platforms-kicker">One subscription. Flipur flips on all the web-based trading platforms.</p>
        <ul className="logo-row">
          {platforms.map((item) => (
            <li key={item.name} className={`logo-plate ${item.tone}`}>
              <img src={item.src} alt={item.name} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
