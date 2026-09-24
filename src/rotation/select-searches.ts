import type { SearchConfig } from "../types/business.js";
import { parseScheduleDate, urgency } from "./frequency.js";

export function selectSearches(searches: SearchConfig[], pendingQueries: ReadonlySet<string>, limit: number, now = new Date()): SearchConfig[] {
  return [...searches].sort((a, b) => {
    const pendingOrder = Number(pendingQueries.has(b.query)) - Number(pendingQueries.has(a.query));
    if (pendingOrder) return pendingOrder;

    const aLast = parseScheduleDate(a.lastRunAt, now);
    const bLast = parseScheduleDate(b.lastRunAt, now);
    if (!aLast && !bLast) return a.priority - b.priority || (a.rowNumber ?? 0) - (b.rowNumber ?? 0);
    if (!aLast) return -1;
    if (!bLast) return 1;

    const urgencyOrder = urgency(b.lastRunAt, b.priority, now) - urgency(a.lastRunAt, a.priority, now);
    if (Number.isFinite(urgencyOrder) && urgencyOrder) return urgencyOrder;
    return a.priority - b.priority || aLast.getTime() - bLast.getTime() || (a.rowNumber ?? 0) - (b.rowNumber ?? 0);
  }).slice(0, Math.max(0, limit));
}
