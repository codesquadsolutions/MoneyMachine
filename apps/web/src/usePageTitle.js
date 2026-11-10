import { useEffect } from "react";

const homeTitle = "Flipur.trade – Flip every order. Same price, opposite side.";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title;
    return () => {
      document.title = homeTitle;
    };
  }, [title]);
}
