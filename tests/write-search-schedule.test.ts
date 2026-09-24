import { describe, expect, it, vi } from "vitest";
import { writeSearchSchedule } from "../src/sheets/write-search-schedule.js";
import type { SheetsClient } from "../src/sheets/client.js";
import type { SearchConfig } from "../src/types/business.js";

const search: SearchConfig = {
  niche: "Móveis", city: "Campinas", state: "SP", maxResults: 10, highValue: "Sim", priority: 1,
  notes: "", query: "Móveis | Campinas, SP", rowNumber: 6, lastRunColumn: 8, nextRunColumn: 9,
};

describe("writeSearchSchedule", () => {
  it("updates only the schedule cells for the selected Busca row", async () => {
    const batchWrite = vi.fn();
    const sheets = { batchWrite } as unknown as SheetsClient;
    await writeSearchSchedule(sheets, [{ search, lastRunAt: "23/09/2026", nextRunAt: "30/09/2026" }]);
    expect(batchWrite).toHaveBeenCalledWith([
      { range: "'Busca'!I6", values: [["23/09/2026"]] },
      { range: "'Busca'!J6", values: [["30/09/2026"]] },
    ]);
  });

  it("skips ad-hoc CLI searches without a corresponding sheet row", async () => {
    const batchWrite = vi.fn();
    const sheets = { batchWrite } as unknown as SheetsClient;
    await writeSearchSchedule(sheets, [{ search: { ...search, rowNumber: undefined }, lastRunAt: "23/09/2026", nextRunAt: "30/09/2026" }]);
    expect(batchWrite).toHaveBeenCalledWith([]);
  });
});
