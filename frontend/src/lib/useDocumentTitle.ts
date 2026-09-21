import { useEffect } from "react";

const SUFFIX = "JS Climatização";

/** Per-route document title + meta description — an SPA keeps index.html's tag
 * otherwise, so every route would share one title. */
export function useDocumentTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title.includes(SUFFIX) ? title : `${title} | ${SUFFIX}`;
    if (!description) return;
    const tag = document.querySelector('meta[name="description"]');
    const previous = tag?.getAttribute("content") ?? null;
    tag?.setAttribute("content", description);
    return () => {
      if (tag && previous !== null) tag.setAttribute("content", previous);
    };
  }, [title, description]);
}
