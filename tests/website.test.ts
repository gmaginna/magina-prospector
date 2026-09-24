import { afterEach, describe, expect, it, vi } from "vitest";
import { inspectWebsite } from "../src/providers/website/inspect-website.js";
import type { Env } from "../src/config/env.js";

const env = { HTTP_TIMEOUT_MS: 1000 } as Env;
const response = (html: string, status = 200) => new Response(html, { status, headers: { "content-type": "text/html" } });

afterEach(() => vi.unstubAllGlobals());

describe("inspectWebsite", () => {
  it("detecta WhatsApp, redes, formulário, telefone e viewport", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response('<html><head><title>Site</title><meta name="viewport" content="width=device-width"></head><body><a href="https://wa.me/55199999">WhatsApp</a><a href="https://instagram.com/empresa">Instagram</a><a href="tel:+5519">Telefone</a><form></form></body></html>')));
    const result = await inspectWebsite("https://example.com", env);
    expect(result).toMatchObject({ reachable: true, hasViewport: true, hasWhatsappLink: true, hasTelLink: true, hasForm: true, title: "Site" });
    expect(result?.instagramUrl).toContain("instagram.com");
  });
  it("trata homepage vazia sem viewport e sem links como fato observável", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response("<html><body>Olá</body></html>")));
    const result = await inspectWebsite("https://example.com", env);
    expect(result).toMatchObject({ reachable: true, hasViewport: false, hasWhatsappLink: false, hasForm: false });
  });
  it("retorna indisponível sem lançar erro em falha de rede", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network failure"); }));
    const result = await inspectWebsite("https://example.com", env);
    expect(result).toMatchObject({ reachable: false, error: "network error" });
  });
});
