import type { SearchConfig } from "../types/business.js";
import { daysLate, parseScheduleDate } from "./frequency.js";

export function selectSearches(searches: SearchConfig[], limit: number, now = new Date()): SearchConfig[] {
  const neverRun = searches
    .filter((search) => !parseScheduleDate(search.lastRunAt, now))
    .sort((a, b) => (a.rowNumber ?? Number.MAX_SAFE_INTEGER) - (b.rowNumber ?? Number.MAX_SAFE_INTEGER) || a.query.localeCompare(b.query));
  const due = searches
    .filter((search) => parseScheduleDate(search.lastRunAt, now) !== null)
    .map((search) => ({ search, lateness: daysLate(search.nextRunAt, now) }))
    .filter((entry): entry is { search: SearchConfig; lateness: number } => entry.lateness !== null)
    .sort((a, b) => b.lateness - a.lateness || a.search.priority - b.search.priority || (a.search.rowNumber ?? Number.MAX_SAFE_INTEGER) - (b.search.rowNumber ?? Number.MAX_SAFE_INTEGER));

  return [...neverRun, ...due.map(({ search }) => search)].slice(0, Math.max(0, limit));
}
