export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function safeGtag(...args) {
  if (typeof window === "undefined") return;
  if (!window.gtag || !GA_ID) return;
  window.gtag(...args);
}

export function trackPageview(url) {
  safeGtag("config", GA_ID, { page_path: url });
}

export function trackEvent(name, params = {}) {
  safeGtag("event", name, params);
}
