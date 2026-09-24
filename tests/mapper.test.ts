import { describe, expect, it } from "vitest";
import { mapPlace } from "../src/providers/apify/mapper.js";
import type { SearchConfig } from "../src/types/business.js";

const search: SearchConfig = { niche: "Móveis planejados", city: "Campinas", state: "SP", maxResults: 10, highValue: "Não sei", priority: 1, notes: "", query: "Móveis planejados | Campinas, SP" };

describe("mapPlace", () => {
  it("aceita campos ausentes sem quebrar e normaliza os campos disponíveis", () => {
    const result = mapPlace({ title: "Marcenaria", placeId: "ChIJ1", phone: "(19) 99999-1111", reviewsCount: 12 }, search);
    expect(result).toMatchObject({ companyName: "Marcenaria", placeId: "ChIJ1", city: "Campinas", phone: "(19) 99999-1111", reviewCount: 12 });
    expect(result?.website).toBeNull();
  });
  it("descarta resultado claramente fora da cidade", () => {
    expect(mapPlace({ title: "Marcenaria", city: "Santos" }, search)).toBeNull();
  });
});
