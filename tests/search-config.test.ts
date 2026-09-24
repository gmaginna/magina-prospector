import { describe, expect, it, vi } from "vitest";
import { readSearchConfig } from "../src/sheets/read-search-config.js";
import type { SheetsClient } from "../src/sheets/client.js";

const headers = ["Ativo?", "Nicho", "Cidade", "UF", "Máx. resultados", "Produto tem bom valor?", "Prioridade da busca", "Observações", "Última execução", "Próxima execução"];

function sheetWith(rows: string[][]): SheetsClient {
  return { read: vi.fn().mockResolvedValue(rows) } as unknown as SheetsClient;
}

describe("readSearchConfig", () => {
  it("reads per-row result caps and scheduling columns", async () => {
    const rows = [[], [], [], [], headers, ["Sim", "Móveis planejados", "Campinas", "SP", "10", "Sim", "1", "", "16/09/2026", "23/09/2026"]];
    const searches = await readSearchConfig(sheetWith(rows));
    expect(searches).toMatchObject([{
      niche: "Móveis planejados", city: "Campinas", maxResults: 10, priority: 1,
      rowNumber: 6, lastRunAt: "16/09/2026", lastRunColumn: 8, nextRunColumn: 9,
    }]);
  });

  it("requires both rotation columns before prospecting", async () => {
    const rows = [headers.slice(0, 8), ["Sim", "Móveis", "Campinas", "SP", "20", "Sim", "1", ""]];
    await expect(readSearchConfig(sheetWith(rows))).rejects.toThrow("lastRun");
  });

  it("rejects an invalid active priority instead of silently scheduling it", async () => {
    const rows = [headers, ["Sim", "Móveis", "Campinas", "SP", "20", "Sim", "P1", "", "", ""]];
    await expect(readSearchConfig(sheetWith(rows))).rejects.toThrow("Prioridade inválida");
  });
});
