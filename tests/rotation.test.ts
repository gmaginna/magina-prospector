import { describe, expect, it } from "vitest";
import { selectSearches } from "../src/rotation/select-searches.js";
import type { SearchConfig } from "../src/types/business.js";

const search = (niche: string, priority: number): SearchConfig => ({ niche, city: "Campinas", state: "SP", maxResults: 20, highValue: "Não sei", priority, notes: "", query: `${niche} | Campinas, SP` });

describe("selectSearches", () => {
  it("prefere buscas pendentes para recuperar uma escrita incompleta", () => {
    const history = [{ rowNumber: 2, values: [], placeId: "", hash: "recovery", query: "Móveis | Campinas, SP", lastSeen: new Date().toISOString(), status: "PENDENTE" }];
    expect(selectSearches([search("Energia solar", 1), search("Móveis", 10)], history, 1)[0]?.niche).toBe("Móveis");
  });
  it("usa prioridade e antiguidade quando não há escritas pendentes", () => {
    const history = [{ rowNumber: 2, values: [], placeId: "x", hash: "x", query: "Móveis | Campinas, SP", lastSeen: new Date().toISOString(), status: "NOVO" }];
    expect(selectSearches([search("Energia solar", 2), search("Móveis", 1)], history, 1)[0]?.niche).toBe("Móveis");
  });
});
