import { useSeo, SEO } from "./seo";

/** @deprecated Prefer useSeo with title, description, and path. */
export function usePageTitle(title) {
  useSeo({
    title,
    description: SEO.home.description,
    path: typeof window !== "undefined" ? window.location.pathname : "/",
  });
}
