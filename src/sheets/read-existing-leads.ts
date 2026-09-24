import { quoteSheet, type SheetsClient } from "./client.js";

export type ExistingAutomation = { rowNumber: number; values: string[]; placeId: string; hash: string; query: string; lastSeen: string; status: string };

export async function readExistingLeads(sheets: SheetsClient): Promise<ExistingAutomation[]> {
  const rows = await sheets.read(`${quoteSheet("Automação")}!A1:N`);
  return rows.slice(1).flatMap((values, index) => {
    const placeId = values[0] ?? "", hash = values[1] ?? "";
    if (!placeId && !hash) return [];
    return [{ rowNumber: index + 2, values, placeId, hash, query: values[5] ?? "", lastSeen: values[7] ?? "", status: values[13] ?? "" }];
  });
}
