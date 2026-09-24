import { TAB } from "../config/constants.js";
import { AUTOMATION_HEADERS, EVIDENCE_HEADERS, SEARCH_HEADERS } from "../types/sheet.js";
import { quoteSheet, type SheetsClient } from "./client.js";

export async function bootstrapSheet(sheets: SheetsClient): Promise<string[]> {
  const metadata = await sheets.metadata();
  const tabs = new Set((metadata.sheets ?? []).map((sheet) => sheet.properties?.title ?? ""));
  const definitions = [
    { title: TAB.search, headers: SEARCH_HEADERS },
    { title: TAB.evidence, headers: EVIDENCE_HEADERS },
    { title: TAB.automation, headers: AUTOMATION_HEADERS },
  ];
  const missing = definitions.filter((item) => !tabs.has(item.title));
  if (!missing.length) return [];
  await sheets.api.spreadsheets.batchUpdate({
    spreadsheetId: sheets.id,
    requestBody: { requests: missing.map(({ title }) => ({ addSheet: { properties: { title } } })) },
  });
  for (const { title, headers } of missing) {
    await sheets.write(`${quoteSheet(title)}!A1`, [headers]);
  }
  return missing.map(({ title }) => title);
}
