const PROFILE = "https://www.instagram.com/flipurtrade";
const REEL = "https://www.instagram.com/reel/DfHMFAPplnx/embed";

export function InstagramFollow() {
  return (
    <p className="insta">
      Follow our{" "}
      <a href={PROFILE} target="_blank" rel="noopener noreferrer">
        Instagram
      </a>{" "}
      for live updates.
    </p>
  );
}

export function ProductReel() {
  return (
    <iframe
      className="reel-frame"
      src={REEL}
      title="Flipur reel: what it is, why it was built, and how a flip works"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
