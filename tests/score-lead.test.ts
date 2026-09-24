import { describe, expect, it } from "vitest";
import { scoreLead } from "../src/scoring/score-lead.js";
import type { Prospect, SearchConfig, WebsiteInspection } from "../src/types/business.js";

const prospect: Prospect = {
  placeId: "place-1", dedupeHash: "hash", companyName: "Empresa", city: "Campinas", state: "SP", niche: "Móveis",
  website: null, phone: null, instagram: null, facebook: null, mapsUrl: "https://maps.google.com/?q=1", rating: 4.7,
  reviewCount: 55, isAdvertisement: null, permanentlyClosed: false, temporarilyClosed: false,
  sourceQuery: "Móveis | Campinas", rawSource: "google_maps",
};
const search: SearchConfig = { niche: "Móveis", city: "Campinas", state: "SP", maxResults: 20, highValue: "Sim", priority: 1, notes: "", query: "Móveis | Campinas" };
const website: WebsiteInspection = { reachable: true, statusCode: 200, finalUrl: "https://example.com", hasHttps: true, hasViewport: true, hasWhatsappLink: true, whatsappLinks: ["https://wa.me/5519999999999"], hasTelLink: true, hasForm: true, instagramUrl: null, facebookUrl: null, title: "Empresa", error: null };

describe("scoreLead", () => {
  it("pontua somente sinais confirmados e produto de alto valor", () => {
    expect(scoreLead(prospect, null, search).score).toBe(6);
    expect(scoreLead({ ...prospect, isAdvertisement: true }, null, search).score).toBe(10);
  });
  it("não pontua anúncios desconhecidos nem qualidade subjetiva", () => {
    const lead = scoreLead({ ...prospect, website: "example.com", reviewCount: null }, { ...website, hasWhatsappLink: false }, { ...search, highValue: "Não sei" });
    expect(lead.score).toBe(0);
    expect(lead.problem).toContain("nenhum acesso direto");
  });
  it("gera a sugestão de captação quando anúncio está confirmado e não há site", () => {
    expect(scoreLead({ ...prospect, isAdvertisement: true }, null, search).offer).toBe("Captação");
  });
});
