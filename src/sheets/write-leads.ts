import type { Lead, SearchConfig } from "../types/business.js";
import { LEAD_START_ROW } from "../types/sheet.js";
import { formatDate } from "../utils/date.js";
import { quoteSheet, type SheetsClient } from "./client.js";

function columnName(index: number): string {
  let value = index + 1, result = "";
  while (value > 0) { const remainder = (value - 1) % 26; result = String.fromCharCode(65 + remainder) + result; value = Math.floor((value - 1) / 26); }
  return result;
}

export async function ensureLeadCapacity(sheets: SheetsClient, requested: number): Promise<number[]> {
  if (requested <= 0) return [];
  const metadata = await sheets.metadata();
  const props = metadata.sheets?.find((sheet) => sheet.properties?.title === "Leads")?.properties;
  if (!props?.sheetId) throw new Error("Aba Leads não encontrada.");
  const rowCount = props.gridProperties?.rowCount ?? 1000;
  const values = await sheets.read(`${quoteSheet("Leads")}!B${LEAD_START_ROW}:B${rowCount}`);
  const usedIndexes = new Set(values.flatMap((row, i) => row[0] ? [LEAD_START_ROW + i] : []));
  const slots: number[] = [];
  for (let row = LEAD_START_ROW; row <= rowCount && slots.length < requested; row += 1) if (!usedIndexes.has(row)) slots.push(row);
  const missing = requested - slots.length;
  if (missing > 0) {
    await sheets.api.spreadsheets.batchUpdate({
      spreadsheetId: sheets.id,
      requestBody: { requests: [
        { insertDimension: { range: { sheetId: props.sheetId, dimension: "ROWS", startIndex: rowCount, endIndex: rowCount + missing }, inheritFromBefore: true } },
        ...(["A:AG"].flatMap((range) => [
          { copyPaste: { source: { sheetId: props.sheetId, startRowIndex: rowCount - 1, endRowIndex: rowCount, startColumnIndex: 0, endColumnIndex: 33 }, destination: { sheetId: props.sheetId, startRowIndex: rowCount, endRowIndex: rowCount + missing, startColumnIndex: 0, endColumnIndex: 33 }, pasteType: "PASTE_FORMAT", pasteOrientation: "NORMAL" } },
          { copyPaste: { source: { sheetId: props.sheetId, startRowIndex: rowCount - 1, endRowIndex: rowCount, startColumnIndex: 0, endColumnIndex: 33 }, destination: { sheetId: props.sheetId, startRowIndex: rowCount, endRowIndex: rowCount + missing, startColumnIndex: 0, endColumnIndex: 33 }, pasteType: "PASTE_DATA_VALIDATION", pasteOrientation: "NORMAL" } },
          { copyPaste: { source: { sheetId: props.sheetId, startRowIndex: rowCount - 1, endRowIndex: rowCount, startColumnIndex: 25, endColumnIndex: 28 }, destination: { sheetId: props.sheetId, startRowIndex: rowCount, endRowIndex: rowCount + missing, startColumnIndex: 25, endColumnIndex: 28 }, pasteType: "PASTE_FORMULA", pasteOrientation: "NORMAL" } },
        ])),
      ] },
    });
    for (let offset = 0; offset < missing; offset += 1) slots.push(rowCount + offset + 1);
  }
  return slots;
}

function leadValues(lead: Lead, search: SearchConfig, runId: string): { main: unknown[]; operation: unknown[] } {
  const site = lead.website ? "Sim" : "Não";
  const domain = lead.hasOwnDomain === null ? "Não sei" : lead.hasOwnDomain ? "Sim" : "Não";
  const mobile = lead.inspection?.reachable && !lead.inspection.hasViewport ? "Não" : "Não sei";
  const whatsapp = lead.inspection?.reachable ? (lead.inspection.hasWhatsappLink ? "Sim" : "Não") : "Não sei";
  const main = [formatDate(lead.discoveredAt), lead.companyName, lead.city ?? search.city, lead.niche, lead.website ?? "", lead.phone ?? "", lead.instagram ?? lead.inspection?.instagramUrl ?? "", "", "Automação / Google Maps", site, domain, lead.website ? "Não sei" : "Não tem", mobile, whatsapp, "Não sei", lead.reviewCount ?? "", lead.isAdvertisement === true ? "Sim" : "Não sei", "Não sei", "Não sei", "Não sei", search.highValue, lead.problem, lead.score, lead.priorityLabel, lead.offer];
  const operation = ["Novo", "", "", "", `Prospector placeId=${lead.placeId ?? ""}; hash=${lead.dedupeHash}; Apify Run ${runId}; evidências na aba Evidências`];
  return { main, operation };
}

export async function writeLeads(sheets: SheetsClient, leads: Array<{ lead: Lead; search: SearchConfig; runId: string }>, alreadyWritten = new Set<string>()): Promise<number[]> {
  const pending = leads.filter(({ lead }) => !alreadyWritten.has(lead.placeId ? `place:${lead.placeId}` : `hash:${lead.dedupeHash}`));
  if (!pending.length) return [];
  const slots = await ensureLeadCapacity(sheets, pending.length);
  const writes: Array<{ range: string; values: unknown[][] }> = [];
  pending.forEach((item, index) => {
    const row = slots[index]!;
    const values = leadValues(item.lead, item.search, item.runId);
    writes.push({ range: `${quoteSheet("Leads")}!A${row}:Y${row}`, values: [values.main] });
    writes.push({ range: `${quoteSheet("Leads")}!AC${row}:AG${row}`, values: [values.operation] });
  });
  await sheets.batchWrite(writes);
  return slots;
}

export function column(index: number): string { return columnName(index); }
