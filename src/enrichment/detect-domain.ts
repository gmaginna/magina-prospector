import { parse } from "tldts";
const excluded = new Set(["instagram.com", "facebook.com", "linktr.ee", "wa.me", "google.com", "business.site"]);

export function hasOwnDomain(url: string | null): boolean | null {
  if (!url) return false;
  try {
    const hostname = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase();
    const parsed = parse(hostname);
    if (!parsed.domain) return null;
    return !excluded.has(parsed.domain);
  } catch { return null; }
}
