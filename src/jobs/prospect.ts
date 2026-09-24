import fs from "node:fs/promises";
import path from "node:path";
import pLimit from "p-limit";
import type { Env } from "../config/env.js";
import { ApifyPlacesProvider } from "../providers/apify/client.js";
import { mapPlace } from "../providers/apify/mapper.js";
import { inspectWebsite } from "../providers/website/inspect-website.js";
import { dedupeKey } from "../utils/hash.js";
import { readSearchConfig } from "../sheets/read-search-config.js";
import { readExistingLeads } from "../sheets/read-existing-leads.js";
import { selectSearches } from "../rotation/select-searches.js";
import { readPriorityThresholds, readWeights } from "../scoring/read-weights.js";
import { scoreLead } from "../scoring/score-lead.js";
import { evidenceFor, writeEvidence } from "../sheets/write-evidence.js";
import { writeAutomation, type AutomationRecord } from "../sheets/write-automation.js";
import { writeLeads } from "../sheets/write-leads.js";
import { readLeadIdentities } from "../sheets/read-lead-identities.js";
import { quoteSheet, type SheetsClient } from "../sheets/client.js";
import type { Lead, Prospect, SearchConfig } from "../types/business.js";
import type { ExistingAutomation } from "../sheets/read-existing-leads.js";

type Options = { dryRun: boolean; maxNewLeads?: number; city?: string; niche?: string };
type Candidate = { lead: Lead; search: SearchConfig; runId: string };

function identity(item: { placeId: string | null; dedupeHash: string }) { return dedupeKey(item); }

function timeValue(value: number | null): number { return value ?? -1; }

function makeSummary(result: Record<string, unknown>): string {
  const top = result.top as Array<{ companyName: string; city: string | null; score: number; problem: string }>;
  const priority = result.priorityCounts as Record<string, number>;
  return [
    "# Magina Prospector", "",
    `- Pesquisas: ${result.searchesSelected}`, `- Resultados brutos: ${result.rawBusinesses}`,
    `- Duplicados: ${result.duplicates}`, `- Inspeções de site: ${result.websiteInspections}`,
    `- Novos candidatos: ${result.newCandidates}`, `- Inseridos na planilha: ${result.inserted}`,
    `- PRIORIDADE: ${priority.PRIORIDADE ?? 0}`, `- ALTO: ${priority.ALTO ?? 0}`, `- MÉDIO: ${priority.MÉDIO ?? 0}`, `- BAIXO: ${priority.BAIXO ?? 0}`,
    `- Erros: ${result.errors}`, "", "## TOP 10", "", "Empresa | Cidade | Score | Problema", "---|---|---:|---",
    ...top.slice(0, 10).map((item) => `${item.companyName.replaceAll("|", " ")} | ${item.city ?? ""} | ${item.score} | ${item.problem.replaceAll("|", " ")}`), "",
  ].join("\n");
}

async function persistRunResult(result: Record<string, unknown>): Promise<void> {
  await fs.mkdir("data", { recursive: true });
  await fs.writeFile(path.join("data", "run-result.json"), JSON.stringify(result, null, 2), "utf8");
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) await fs.appendFile(summaryPath, makeSummary(result), "utf8");
}

export async function prospect(sheets: SheetsClient, env: Env, options: Options): Promise<Record<string, unknown>> {
  const startedAt = new Date();
  const existing = await readExistingLeads(sheets);
  const configured = await readSearchConfig(sheets);
  const filtered = configured.filter((item) => (!options.city || item.city.toLowerCase() === options.city.toLowerCase()) && (!options.niche || item.niche.toLowerCase() === options.niche.toLowerCase()));
  let searches = filtered;
  if (!searches.length && options.city && options.niche) searches = [{ niche: options.niche, city: options.city, state: "", maxResults: env.MAX_RESULTS_PER_SEARCH, highValue: "Não sei", priority: 999, notes: "CLI override", query: `${options.niche} | ${options.city}` }];
  if (!searches.length) throw new Error("Nenhuma busca ativa encontrada na aba Busca ou compatível com os filtros informados.");
  const selected = selectSearches(searches, existing, env.MAX_SEARCHES_PER_RUN);
  const weights = await readWeights(sheets);
  const priorityThresholds = await readPriorityThresholds(sheets);
  const apify = new ApifyPlacesProvider(env);
  const rawByIdentity = new Map<string, { prospect: Prospect; search: SearchConfig; runId: string }>();
  const runIds: string[] = [];
  let rawBusinesses = 0;
  let invalid = 0;
  for (const search of selected) {
    const response = await apify.search(search, env.MAX_RESULTS_PER_SEARCH);
    runIds.push(response.runId);
    rawBusinesses += response.items.length;
    for (const item of response.items) {
      const prospectItem = mapPlace(item, search);
      if (!prospectItem || prospectItem.permanentlyClosed || prospectItem.temporarilyClosed) { invalid += 1; continue; }
      const key = identity(prospectItem);
      if (!rawByIdentity.has(key)) rawByIdentity.set(key, { prospect: prospectItem, search, runId: response.runId });
    }
  }

  const pendingIdentities = new Set(existing.filter((item) => item.status === "PENDENTE").map((item) => item.placeId ? `place:${item.placeId}` : `hash:${item.hash}`));
  const existingIdentities = new Set(existing.map((item) => item.placeId ? `place:${item.placeId}` : `hash:${item.hash}`));
  const leadIdentities = await readLeadIdentities(sheets);
  for (const key of leadIdentities) existingIdentities.add(key);
  const limit = pLimit(env.WEBSITE_CONCURRENCY);
  let websiteInspections = 0;
  const leads = await Promise.all([...rawByIdentity.values()].map(({ prospect: item, search, runId }) => limit(async () => {
    const inspection = await inspectWebsite(item.website, env);
    if (item.website) websiteInspections += 1;
    return { lead: scoreLead(item, inspection, search, weights, new Date(), priorityThresholds), search, runId };
  })));
  const candidates: Candidate[] = leads.filter(({ lead }) => !existingIdentities.has(identity(lead)) || pendingIdentities.has(identity(lead)));
  const duplicateCount = rawBusinesses - invalid - candidates.length;
  candidates.sort((a, b) => b.lead.score - a.lead.score || timeValue(b.lead.reviewCount) - timeValue(a.lead.reviewCount) || timeValue(b.lead.rating) - timeValue(a.lead.rating));
  const cap = Math.min(options.maxNewLeads ?? env.MAX_NEW_LEADS_PER_RUN, 100);
  const selectedLeads = candidates.slice(0, cap);
  const selectedIdentities = new Set(selectedLeads.map(({ lead }) => identity(lead)));
  const automationRecords: AutomationRecord[] = leads.map(({ lead, runId }) => ({
    lead, runId,
    status: pendingIdentities.has(identity(lead)) ? (selectedIdentities.has(identity(lead)) ? "NOVO" : "IGNORADO") : existingIdentities.has(identity(lead)) ? "ATUALIZADO" : selectedIdentities.has(identity(lead)) ? "NOVO" : "IGNORADO",
  }));

  let inserted = 0;
  if (!options.dryRun) {
    const stagedRecords: AutomationRecord[] = automationRecords.map((record) => selectedIdentities.has(identity(record.lead)) ? { ...record, status: "PENDENTE" } : record);
    await writeAutomation(sheets, stagedRecords, existing);
    const written = await writeLeads(sheets, selectedLeads, leadIdentities);
    inserted = written.length;
    await writeEvidence(sheets, selectedLeads.map(({ lead }) => evidenceFor(lead)));
    await writeAutomation(sheets, automationRecords, await readExistingLeads(sheets));
  }

  const priorityCounts = selectedLeads.reduce<Record<string, number>>((counts, { lead }) => { counts[lead.priorityLabel] = (counts[lead.priorityLabel] ?? 0) + 1; return counts; }, {});
  const runId = runIds.join(",");
  const result: Record<string, unknown> = {
    runId, startedAt: startedAt.toISOString(), finishedAt: new Date().toISOString(), searchesSelected: selected.map((item) => item.query),
    rawBusinesses, invalid, duplicates: duplicateCount, websiteInspections, newCandidates: candidates.length, inserted,
    updatedRecords: leads.filter(({ lead }) => existingIdentities.has(identity(lead))).length,
    errors: leads.filter(({ lead }) => Boolean(lead.inspection?.error)).length,
    priorityCounts,
    top: candidates.slice(0, 20).map(({ lead }) => ({ companyName: lead.companyName, city: lead.city, score: lead.score, priority: lead.priorityLabel, problem: lead.problem })),
    prospects: leads.map(({ lead, runId: apifyRunId }) => ({ ...lead, discoveredAt: lead.discoveredAt.toISOString(), apifyRunId })),
  };
  await persistRunResult(result);
  console.log(makeSummary(result));
  if (options.dryRun) {
    console.log("\nPreview dos 20 melhores candidatos:");
    for (const { lead } of candidates.slice(0, 20)) console.log(`${lead.score}\t${lead.priorityLabel}\t${lead.companyName}\t${lead.city ?? ""}\t${lead.problem}`);
    console.log("\nDry-run: nenhum dado foi gravado na planilha.");
  }
  return result;
}

export async function validationSummary(sheets: SheetsClient): Promise<string[]> {
  const metadata = await sheets.metadata();
  return (metadata.sheets ?? []).map((item) => item.properties?.title ?? "");
}

export async function sheetHeaders(sheets: SheetsClient): Promise<string[][]> {
  return sheets.read(`${quoteSheet("Leads")}!A7:AG7`);
}
