import { TAB } from "../config/constants.js";
import { LEAD_HEADERS } from "../types/sheet.js";
import { quoteSheet, type SheetsClient } from "./client.js";

export async function validateSheet(sheets: SheetsClient): Promise<{ tabs: string[]; leadHeaders: string[] }> {
  await sheets.verifyAuthentication();
  console.log("✓ Google authentication OK");

  let metadata;
  try {
    metadata = await sheets.metadata();
  } catch {
    throw new Error("Spreadsheet not found or inaccessible. Confira GOOGLE_SHEET_ID e o compartilhamento com a service account.");
  }
  if (!metadata.properties?.title) throw new Error("A resposta da Google Sheets API não incluiu os metadados da planilha.");
  console.log("✓ Spreadsheet found");

  const tabs = (metadata.sheets ?? []).map((sheet) => sheet.properties?.title ?? "");
  const requiredTabs = [TAB.plans, TAB.leads, TAB.config, TAB.search, TAB.evidence, TAB.automation];
  const missing = requiredTabs.filter((tab) => !tabs.includes(tab));
  for (const tab of requiredTabs) console.log(`${tabs.includes(tab) ? "✓" : "✗"} ${tab}`);
  if (missing.length) throw new Error(`Abas obrigatórias ausentes: ${missing.join(", ")}. Execute npm run bootstrap-sheet.`);

  const rows = await sheets.read(`${quoteSheet(TAB.leads)}!A7:AG7`);
  const headers = rows[0] ?? [];
  const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const columnName = (zeroIndex: number) => {
    let number = zeroIndex + 1, name = "";
    while (number > 0) { const remainder = (number - 1) % 26; name = String.fromCharCode(65 + remainder) + name; number = Math.floor((number - 1) / 26); }
    return name;
  };
  const mismatches = LEAD_HEADERS.flatMap((expected, index) => normalized(headers[index] ?? "") === normalized(expected) ? [] : [`${columnName(index)}: esperado "${expected}", encontrado "${headers[index] ?? ""}"`]);
  if (mismatches.length) throw new Error(`Cabeçalho Leads (linha 7) incompatível: ${mismatches.join("; ")}`);
  console.log("Spreadsheet schema valid.");
  return { tabs, leadHeaders: headers };
}
