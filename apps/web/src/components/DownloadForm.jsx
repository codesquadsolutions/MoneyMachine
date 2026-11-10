import {
  ADD_TO_CHROME_LABEL,
  FREE_FLIP_LIMIT,
  chromeWebStoreUrl,
  hasChromeWebStoreUrl,
} from "../content/download";

export function DownloadForm({ compact = false }) {
  const store = chromeWebStoreUrl();

  return (
    <div className={`download-block${compact ? " compact" : ""}`} id="download">
      {hasChromeWebStoreUrl() ? (
        <a className="btn p download-btn" href={store} target="_blank" rel="noopener noreferrer">
          {ADD_TO_CHROME_LABEL}
        </a>
      ) : null}
      <p className="hint download-hint">
        {FREE_FLIP_LIMIT} free order flips in Chrome—no card up front. After that, Flipur asks you to finish payment for Pro and keep flipping on every supported platform.
      </p>
    </div>
  );
}
