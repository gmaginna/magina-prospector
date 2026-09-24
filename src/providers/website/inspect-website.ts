import * as cheerio from "cheerio";
import type { Env } from "../../config/env.js";
import { USER_AGENT } from "../../config/constants.js";
import type { WebsiteInspection } from "../../types/business.js";

const emptyInspection = (url: string | null): WebsiteInspection => ({
  reachable: false, statusCode: null, finalUrl: url, hasHttps: false, hasViewport: false,
  hasWhatsappLink: false, whatsappLinks: [], hasTelLink: false, hasForm: false,
  instagramUrl: null, facebookUrl: null, title: null, error: null,
});

function absolutize(value: string, base: string): string | null {
  try { return new URL(value, base).toString(); } catch { return null; }
}

export async function inspectWebsite(url: string | null, env: Env): Promise<WebsiteInspection | null> {
  if (!url) return null;
  const result = emptyInspection(url);
  let target = url;
  if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
  let lastError = "site inspection unavailable";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.HTTP_TIMEOUT_MS);
    try {
      const response = await fetch(target, { redirect: "follow", signal: controller.signal, headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" } });
      result.statusCode = response.status;
      result.finalUrl = response.url || target;
      result.hasHttps = result.finalUrl.startsWith("https:");
      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        if (response.status < 500 || attempt === 2) break;
        continue;
      }
      const html = await response.text();
      const $ = cheerio.load(html);
      result.reachable = true;
      result.hasViewport = $("meta[name='viewport' i]").length > 0;
      result.hasForm = $("form").length > 0;
      result.title = $("title").first().text().trim() || null;
      const links = $("a[href]").toArray().map((element) => $(element).attr("href") ?? "");
      const whatsApp = links.filter((href) => /(?:wa\.me|api\.whatsapp\.com|whatsapp\.com\/send|^whatsapp:)/i.test(href)).map((href) => absolutize(href, result.finalUrl!)).filter((item): item is string => Boolean(item));
      result.whatsappLinks = [...new Set(whatsApp)];
      result.hasWhatsappLink = result.whatsappLinks.length > 0;
      result.hasTelLink = links.some((href) => /^tel:/i.test(href));
      result.instagramUrl = links.map((href) => absolutize(href, result.finalUrl!)).find((href) => href && /(?:^|\.)instagram\.com\//i.test(new URL(href).host + new URL(href).pathname)) ?? null;
      result.facebookUrl = links.map((href) => absolutize(href, result.finalUrl!)).find((href) => href && /(?:^|\.)(?:facebook\.com|fb\.com)\//i.test(new URL(href).host + new URL(href).pathname)) ?? null;
      return result;
    } catch (error) {
      lastError = error instanceof Error && error.name === "AbortError" ? "timeout" : "network error";
      if (attempt === 2) break;
    } finally { clearTimeout(timer); }
  }
  result.error = lastError;
  return result;
}
