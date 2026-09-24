import { describe, expect, it, vi } from "vitest";
import { bootstrapSheet } from "../src/sheets/bootstrap-sheet.js";
import { AUTOMATION_HEADERS } from "../src/types/sheet.js";
import type { SheetsClient } from "../src/sheets/client.js";

function makeSheets(searchRows: string[][], automationRows: string[][]) {
  const batchWrite = vi.fn();
  const write = vi.fn(async (range: string, values: unknown[][]) => {
    if (range === "'Busca'!I5:J5") searchRows[4] = [...searchRows[4]!, ...(values[0] as string[])];
  });
  const read = vi.fn(async (range: string) => range.includes("'Busca'") ? searchRows : automationRows);
  const sheets = {
    id: "sheet-id", metadata: vi.fn().mockResolvedValue({ sheets: ["Busca", "Evidências", "Automação"].map((title) => ({ properties: { title } })) }),
    read, write, batchWrite, api: {},
  } as unknown as SheetsClient;
  return { sheets, write, batchWrite };
}

describe("bootstrapSheet scheduling migration", () => {
  it("adds scheduling headers and seeds the latest matching automation history", async () => {
    const searchRows: string[][] = [[], [], [], [], ["Ativo?", "Nicho", "Cidade", "UF", "Máx. resultados", "Produto tem bom valor?", "Prioridade da busca", "Observações"], ["Sim", "Móveis", "Campinas", "SP", "10", "Sim", "1", ""]];
    const automationRows = [AUTOMATION_HEADERS, ["place-1", "hash", "Empresa", "Móveis", "Campinas", "Móveis | Campinas, SP", "2026-09-15T12:00:00.000Z", "2026-09-20T12:00:00.000Z"]];
    const { sheets, write, batchWrite } = makeSheets(searchRows, automationRows);
    const changes = await bootstrapSheet(sheets);
    expect(write).toHaveBeenCalledWith("'Busca'!I5:J5", [["Última execução", "Próxima execução"]]);
    expect(batchWrite).toHaveBeenCalledWith([
      { range: "'Busca'!I6", values: [["20/09/2026"]] },
      { range: "'Busca'!J6", values: [["27/09/2026"]] },
    ]);
    expect(changes).toContain("colunas Última execução e Próxima execução adicionadas em Busca");
  });

  it("refuses to append headers over existing unlabelled data", async () => {
    const searchRows: string[][] = [[], [], [], [], ["Ativo?", "Nicho", "Cidade", "UF", "Máx. resultados", "Produto tem bom valor?", "Prioridade da busca", "Observações"], ["Sim", "Móveis", "Campinas", "SP", "10", "Sim", "1", "", "keep-me"]];
    const { sheets, write } = makeSheets(searchRows, [AUTOMATION_HEADERS]);
    await expect(bootstrapSheet(sheets)).rejects.toThrow("sem sobrescrever dados existentes");
    expect(write).not.toHaveBeenCalled();
  });
});
