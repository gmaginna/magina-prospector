import type { SearchConfig } from "../types/business.js";
import type { ExistingAutomation } from "../sheets/read-existing-leads.js";

function timeOf(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function selectSearches(searches: SearchConfig[], history: ExistingAutomation[], limit: number): SearchConfig[] {
  const lastRun = new Map<string, number>();
  for (const entry of history) lastRun.set(entry.query, Math.max(lastRun.get(entry.query) ?? 0, timeOf(entry.lastSeen)));
  const pending = new Set(history.filter((entry) => entry.status === "PENDENTE").map((entry) => entry.query));
  return [...searches].sort((a, b) => Number(pending.has(b.query)) - Number(pending.has(a.query)) || a.priority - b.priority || (lastRun.get(a.query) ?? 0) - (lastRun.get(b.query) ?? 0) || a.query.localeCompare(b.query)).slice(0, limit);
}
