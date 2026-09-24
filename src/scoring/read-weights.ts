import { DEFAULT_WEIGHTS } from "../config/constants.js";
import type { ScoreWeights } from "./score-lead.js";
import { quoteSheet, type SheetsClient } from "../sheets/client.js";
import { normalizeText } from "../utils/normalize.js";
import { DEFAULT_PRIORITY } from "../config/constants.js";

const patterns: Array<[keyof ScoreWeights, RegExp]> = [
  ["googleAds", /google.*ads|anuncia.*google/], ["metaAds", /meta.*ads|facebook.*instagram/],
  ["adNotSpecific", /anuncio.*especific/], ["badOrMissingSite", /site.*(ruim|inexistente|sem site)/],
  ["reviews50Plus", /50.*avaliacoes|avaliacoes.*50/], ["instagramActive", /instagram.*ativo/],
  ["whatsappAvailable", /whatsapp.*(facil|disponivel)/], ["highValueProduct", /produto.*bom valor/],
];

export type PriorityThresholds = typeof DEFAULT_PRIORITY;

export async function readWeights(sheets: SheetsClient): Promise<ScoreWeights> {
  try {
    const rows = await sheets.read(`${quoteSheet("Configuração")}!A1:Z200`);
    const weights = { ...DEFAULT_WEIGHTS };
    let found = false;
    for (const row of rows) for (const [index, cell] of row.entries()) {
      const pair = patterns.find(([, pattern]) => pattern.test(normalizeText(cell)));
      if (!pair) continue;
      const numeric = row.slice(index + 1).filter((value) => String(value).trim() !== "").map(Number).find((value) => Number.isFinite(value));
      if (numeric !== undefined) { weights[pair[0]] = numeric; found = true; }
    }
    return found ? weights : DEFAULT_WEIGHTS;
  } catch { return DEFAULT_WEIGHTS; }
}

export async function readPriorityThresholds(sheets: SheetsClient): Promise<PriorityThresholds> {
  try {
    const rows = await sheets.read(`${quoteSheet("Configuração")}!A1:Z200`);
    const thresholds = { ...DEFAULT_PRIORITY };
    const keys: Array<[keyof PriorityThresholds, string]> = [["priority", "prioridade"], ["high", "alto"], ["medium", "medio"]];
    let found = false;
    for (const row of rows) for (const [index, cell] of row.entries()) {
      const key = keys.find(([, label]) => normalizeText(cell) === label);
      if (!key) continue;
      const numeric = row.slice(index + 1).filter((value) => String(value).trim() !== "").map(Number).find((value) => Number.isFinite(value));
      if (numeric !== undefined) { thresholds[key[0]] = numeric; found = true; }
    }
    return found ? thresholds : DEFAULT_PRIORITY;
  } catch { return DEFAULT_PRIORITY; }
}
