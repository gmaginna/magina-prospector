import { describe, expect, it } from "vitest";
import { daysLate, priorityIntervalDays } from "../src/rotation/frequency.js";
import { selectSearches } from "../src/rotation/select-searches.js";
import type { SearchConfig } from "../src/types/business.js";

const now = new Date("2026-09-23T12:00:00-03:00");
const search = (niche: string, priority: number, lastRunAt: string | null = null, nextRunAt: string | null = null, rowNumber = 6): SearchConfig => ({
  niche, city: "Campinas", state: "SP", maxResults: 20, highValue: "Não sei", priority, notes: "",
  query: `${niche} | Campinas, SP`, lastRunAt, nextRunAt, rowNumber,
});

describe("selectSearches", () => {
  it("uses 60, 90, and 120-day intervals by priority", () => {
    expect([1, 2, 3].map(priorityIntervalDays)).toEqual([60, 90, 120]);
    expect(() => priorityIntervalDays(4)).toThrow("Prioridade da busca deve ser 1, 2 ou 3");
  });

  it("prefers every never-run search in sheet order, regardless of priority", () => {
    const searches = [
      search("Due p1", 1, "23/07/2026", "21/09/2026", 6),
      search("Never p2", 2, null, "Agora", 8),
      search("Never p1", 1, null, "Agora", 9),
    ];
    expect(selectSearches(searches, 2, now).map(({ niche }) => niche)).toEqual(["Never p2", "Never p1"]);
  });

  it("selects only due searches and ranks the most overdue first", () => {
    const searches = [
      search("P1 late 7 days", 1, "23/07/2026", "16/09/2026"),
      search("P2 late 20 days", 2, "25/06/2026", "03/09/2026"),
      search("P1 future", 1, "23/07/2026", "22/11/2026"),
    ];
    expect(selectSearches(searches, 2, now).map(({ niche }) => niche)).toEqual(["P2 late 20 days", "P1 late 7 days"]);
  });

  it("returns no work when every executed search is scheduled for the future", () => {
    const searches = [search("A", 1, "23/07/2026", "22/11/2026"), search("B", 2, "25/06/2026", "23/12/2026")];
    expect(selectSearches(searches, 4, now)).toEqual([]);
  });

  it("applies the configured execution limit", () => {
    const searches = [search("A", 1), search("B", 2), search("C", 3)];
    expect(selectSearches(searches, 2, now)).toHaveLength(2);
  });

  it("treats a cleared last-run field as never executed", () => {
    expect(selectSearches([search("Reset", 2, null, "20/12/2026")], 1, now)[0]?.niche).toBe("Reset");
  });

  it("calculates lateness from Próxima execução", () => {
    expect(daysLate("16/09/2026", now)).toBe(7);
    expect(daysLate("24/09/2026", now)).toBeNull();
    expect(daysLate("Agora", now)).toBe(0);
  });
});
