import { TAB } from "../config/constants.js";
import { AUTOMATION_HEADERS, EVIDENCE_HEADERS, SEARCH_HEADERS } from "../types/sheet.js";
import { formatScheduleDate, nextRunDate, parseScheduleDate } from "../rotation/frequency.js";
import { normalizeText } from "../utils/normalize.js";
import { quoteSheet, type SheetsClient } from "./client.js";
import { readExistingLeads } from "./read-existing-leads.js";
import { readSearchConfig } from "./read-search-config.js";
import { columnName, writeSearchSchedule } from "./write-search-schedule.js";

export async function bootstrapSheet(sheets: SheetsClient): Promise<string[]> {
  const metadata = await sheets.metadata();
  const tabs = new Set((metadata.sheets ?? []).map((sheet) => sheet.properties?.title ?? ""));
  const definitions = [
    { title: TAB.search, headers: SEARCH_HEADERS },
    { title: TAB.evidence, headers: EVIDENCE_HEADERS },
    { title: TAB.automation, headers: AUTOMATION_HEADERS },
  ];
  const missing = definitions.filter((item) => !tabs.has(item.title));
  if (missing.length) {
    await sheets.api.spreadsheets.batchUpdate({
      spreadsheetId: sheets.id,
      requestBody: { requests: missing.map(({ title }) => ({ addSheet: { properties: { title } } })) },
    });
    for (const { title, headers } of missing) await sheets.write(`${quoteSheet(title)}!A1`, [headers]);
  }

  const rows = await sheets.read(`${quoteSheet(TAB.search)}!A1:Z1000`);
  const headerIndex = rows.findIndex((row) => row.some((cell) => ["ativo", "ativo?"].includes(normalizeText(cell))));
  if (headerIndex < 0) throw new Error("Não encontrei a linha de cabeçalho na aba Busca (coluna Ativo?).");
  const headers = rows[headerIndex] ?? [];
  const expected = ["Última execução", "Próxima execução"];
  const missingHeaders = expected.filter((label) => !headers.some((header) => normalizeText(header) === normalizeText(label)));
  if (missingHeaders.length) {
    const lastUsedColumn = headers.reduce((last, value, index) => value.trim() ? index : last, -1);
    const startColumn = lastUsedColumn + 1;
    const targetColumns = missingHeaders.map((_, index) => startColumn + index);
    const occupied = rows.slice(headerIndex + 1).some((row) => targetColumns.some((column) => Boolean(row[column]?.trim())));
    if (occupied) throw new Error("Não posso acrescentar as colunas de rotação sem sobrescrever dados existentes na aba Busca.");
    const start = columnName(startColumn), end = columnName(startColumn + missingHeaders.length - 1);
    await sheets.write(`${quoteSheet(TAB.search)}!${start}${headerIndex + 1}:${end}${headerIndex + 1}`, [missingHeaders]);
  }

  const searches = await readSearchConfig(sheets);
  const history = await readExistingLeads(sheets);
  const lastRunByQuery = new Map<string, Date>();
  for (const record of history) {
    const date = parseScheduleDate(record.lastSeen);
    const prior = lastRunByQuery.get(record.query);
    if (date && (!prior || date > prior)) lastRunByQuery.set(record.query, date);
  }
  const schedule = searches.map((search) => {
    const historyDate = lastRunByQuery.get(search.query);
    const lastRunAt = search.lastRunAt || (historyDate ? formatScheduleDate(historyDate) : undefined);
    return { search, ...(lastRunAt && !search.lastRunAt ? { lastRunAt } : {}), nextRunAt: nextRunDate(lastRunAt, search.priority) };
  });
  await writeSearchSchedule(sheets, schedule);

  const changes = missing.map(({ title }) => `aba ${title} criada`);
  if (missingHeaders.length) changes.push("colunas Última execução e Próxima execução adicionadas em Busca");
  if (schedule.length) changes.push("próximas execuções calculadas; histórico existente preservado");
  return changes;
}
