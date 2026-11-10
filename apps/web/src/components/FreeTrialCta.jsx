import { DownloadForm } from "./DownloadForm";
import { FREE_FLIP_LIMIT } from "../content/download";

export function FreeTrialCta({
  title = "Try Flipur before you pay.",
  subtitle,
}) {
  return (
    <section className="page-cta">
      <div className="w">
        <div className="final">
          <h2>{title}</h2>
          <p className="sub">
            {subtitle ||
              `Download the Chrome extension and flip your first ${FREE_FLIP_LIMIT} orders on the house. Subscribe only when you are ready for flip number six.`}
          </p>
          <DownloadForm />
        </div>
      </div>
    </section>
  );
}
