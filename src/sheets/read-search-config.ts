import type { SearchConfig } from "../types/business.js";
import { normalizeText } from "../utils/normalize.js";
import { quoteSheet, type SheetsClient } from "./client.js";

function indexOfHeader(headers: string[], candidates: string[]): number {
  return headers.findIndex((header) => candidates.includes(normalizeText(header)));
}

export async function readSearchConfig(sheets: SheetsClient): Promise<SearchConfig[]> {
  const rows = await sheets.read(`${quoteSheet("Busca")}!A1:H1000`);
  const headerIndex = rows.findIndex((row) => row.some((cell) => ["ativo", "ativo?"].includes(normalizeText(cell))));
  if (headerIndex < 0) throw new Error("Não encontrei a linha de cabeçalho na aba Busca (coluna Ativo?).");
  const headers = rows[headerIndex] ?? [];
  const columns = {
    active: indexOfHeader(headers, ["ativo", "ativo?"]), niche: indexOfHeader(headers, ["nicho", "segmento"]),
    city: indexOfHeader(headers, ["cidade"]), state: indexOfHeader(headers, ["uf", "estado"]),
    max: indexOfHeader(headers, ["max resultados", "maximo resultados", "limite resultados"]),
    highValue: indexOfHeader(headers, ["produto tem bom valor", "produto servico tem bom valor"]),
    priority: indexOfHeader(headers, ["prioridade da busca", "prioridade"]), notes: indexOfHeader(headers, ["observacoes", "observacao"]),
  };
  for (const key of ["active", "niche", "city"] as const) if (columns[key] < 0) throw new Error(`Coluna obrigatória ausente na aba Busca: ${key}`);
  const get = (row: string[], column: number, fallback = "") => column >= 0 ? (row[column] ?? fallback).trim() : fallback;
  return rows.slice(headerIndex + 1).flatMap((row): SearchConfig[] => {
    if (!/^sim$/i.test(get(row, columns.active))) return [];
    const niche = get(row, columns.niche), city = get(row, columns.city);
    if (!niche || !city) return [];
    const max = Number(get(row, columns.max, "20"));
    const priority = Number(get(row, columns.priority, "999"));
    const highValueText = get(row, columns.highValue, "Não sei");
    const highValue = /^(sim|não|nao)$/i.test(highValueText) ? (normalizeText(highValueText) === "sim" ? "Sim" : "Não") : "Não sei";
    const state = get(row, columns.state);
    return [{ niche, city, state, maxResults: Number.isFinite(max) && max > 0 ? Math.min(max, 100) : 20, highValue, priority: Number.isFinite(priority) ? priority : 999, notes: get(row, columns.notes), query: `${niche} | ${city}${state ? `, ${state}` : ""}` }];
  });
}
