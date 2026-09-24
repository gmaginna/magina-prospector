import type { Lead } from "../types/business.js";
import { AUTOMATION_HEADERS } from "../types/sheet.js";
import { isoDate } from "../utils/date.js";
import { quoteSheet, type SheetsClient } from "./client.js";
import type { ExistingAutomation } from "./read-existing-leads.js";

export type AutomationRecord = { lead: Lead; runId: string; status: "NOVO" | "ATUALIZADO" | "IGNORADO" | "PENDENTE" };

export async function writeAutomation(sheets: SheetsClient, records: AutomationRecord[], existing: ExistingAutomation[], now = new Date()): Promise<void> {
  if (!records.length) return;
  const byIdentity = new Map(existing.map((item) => [item.placeId ? `place:${item.placeId}` : `hash:${item.hash}`, item]));
  const writes: Array<{ range: string; values: unknown[][] }> = [];
  const appended: unknown[][] = [];
  for (const record of records) {
    const { lead, runId, status } = record;
    const identity = lead.placeId ? `place:${lead.placeId}` : `hash:${lead.dedupeHash}`;
    const prior = byIdentity.get(identity);
    const row = [lead.placeId ?? "", lead.dedupeHash, lead.companyName, lead.niche, lead.city ?? "", lead.sourceQuery,
      prior?.values[6] ?? isoDate(now), isoDate(now), lead.website ? isoDate(now) : (prior?.values[8] ?? ""),
      lead.isAdvertisement === true ? isoDate(now) : (prior?.values[9] ?? ""), prior?.values[10] ?? "", runId,
      process.env.AUTOMATION_VERSION ?? "1.0.0", status];
    if (prior) writes.push({ range: `${quoteSheet("Automação")}!A${prior.rowNumber}:N${prior.rowNumber}`, values: [row] });
    else appended.push(row);
  }
  const used = (await sheets.read(`${quoteSheet("Automação")}!A1:N`)).length;
  if (used === 0) await sheets.write(`${quoteSheet("Automação")}!A1`, [AUTOMATION_HEADERS]);
  await sheets.batchWrite(writes);
  if (appended.length) await sheets.append(`${quoteSheet("Automação")}!A:N`, appended);
}
