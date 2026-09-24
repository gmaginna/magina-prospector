import { quoteSheet, type SheetsClient } from "./client.js";
import { LEAD_START_ROW } from "../types/sheet.js";

export async function readLeadIdentities(sheets: SheetsClient): Promise<Set<string>> {
  const rows = await sheets.read(`${quoteSheet("Leads")}!A${LEAD_START_ROW}:AG`);
  const identities = new Set<string>();
  for (const row of rows) {
    const note = row[32] ?? "";
    const placeId = /(?:^|[;\s])placeId=([^;\s]*)/.exec(note)?.[1];
    const hash = /(?:^|[;\s])hash=([a-f0-9]{64})/i.exec(note)?.[1];
    if (placeId) identities.add(`place:${placeId}`);
    else if (hash) identities.add(`hash:${hash}`);
  }
  return identities;
}
