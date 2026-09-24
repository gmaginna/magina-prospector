import { describe, expect, it } from "vitest";
import { priorityIntervalDays } from "../src/rotation/frequency.js";
import { selectSearches } from "../src/rotation/select-searches.js";
import type { SearchConfig } from "../src/types/business.js";

const now = new Date("2026-09-23T12:00:00-03:00");
const search = (niche: string, priority: number, lastRunAt: string | null = null, rowNumber = 6): SearchConfig => ({
  niche, city: "Campinas", state: "SP", maxResults: 20, highValue: "Não sei", priority, notes: "",
  query: `${niche} | Campinas, SP`, lastRunAt, rowNumber,
});

describe("selectSearches", () => {
  it("uses one-week intervals per priority level", () => {
    expect([1, 2, 3].map(priorityIntervalDays)).toEqual([7, 14, 21]);
  });

  it("prefers never-run searches, ordered by smaller priority and sheet order", () => {
    const searches = [
      search("Recent p1", 1, "22/09/2026", 6),
      search("Never p2", 2, null, 9),
      search("Never p1 first row", 1, null, 7),
      search("Never p1 second row", 1, null, 8),
    ];
    expect(selectSearches(searches, new Set(), 3, now).map(({ niche }) => niche)).toEqual([
      "Never p1 first row", "Never p1 second row", "Never p2",
    ]);
  });

  it("ranks executed searches by elapsed days divided by their priority interval", () => {
    const searches = [
      search("P1 due", 1, "16/09/2026"), // 7 / 7 = 1
      search("P2 overdue", 2, "03/09/2026"), // 20 / 14 > 1
      search("P1 recent", 1, "22/09/2026"),
    ];
    expect(selectSearches(searches, new Set(), 2, now).map(({ niche }) => niche)).toEqual(["P2 overdue", "P1 due"]);
  });

  it("keeps pending writes first so an interrupted search can be recovered", () => {
    const searches = [search("Never", 1), search("Recovery", 3, "22/09/2026")];
    expect(selectSearches(searches, new Set(["Recovery | Campinas, SP"]), 1, now)[0]?.niche).toBe("Recovery");
  });

  it("applies the configured execution limit", () => {
    const searches = [search("A", 1), search("B", 2), search("C", 3)];
    expect(selectSearches(searches, new Set(), 2, now)).toHaveLength(2);
  });
});
