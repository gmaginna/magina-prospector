import type { SearchConfig } from "../types/business.js";
import { quoteSheet, type SheetsClient } from "./client.js";

export type SearchScheduleUpdate = {
  search: SearchConfig;
  lastRunAt?: string;
  nextRunAt?: string;
};

export function columnName(zeroBasedIndex: number): string {
  let number = zeroBasedIndex + 1;
  let name = "";
  while (number > 0) {
    const remainder = (number - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    number = Math.floor((number - 1) / 26);
  }
  return name;
}

export async function writeSearchSchedule(sheets: SheetsClient, updates: SearchScheduleUpdate[]): Promise<void> {
  const ranges = updates.flatMap(({ search, lastRunAt, nextRunAt }) => {
    if (!search.rowNumber) return [];
    const writes: Array<{ range: string; values: string[][] }> = [];
    if (lastRunAt !== undefined && search.lastRunColumn !== undefined) {
      writes.push({ range: `${quoteSheet("Busca")}!${columnName(search.lastRunColumn)}${search.rowNumber}`, values: [[lastRunAt]] });
    }
    if (nextRunAt !== undefined && search.nextRunColumn !== undefined) {
      writes.push({ range: `${quoteSheet("Busca")}!${columnName(search.nextRunColumn)}${search.rowNumber}`, values: [[nextRunAt]] });
    }
    return writes;
  });
  await sheets.batchWrite(ranges);
}
