const DAY_MS = 24 * 60 * 60 * 1000;
const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

function saoPauloCalendarDate(value: Date): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(value);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day"), 12));
}

export function parseScheduleDate(value: string | null | undefined, now = new Date()): Date | null {
  const text = value?.trim();
  if (!text) return null;

  const localDate = text.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
  if (localDate) {
    const year = Number(localDate[3] ?? saoPauloCalendarDate(now).getUTCFullYear());
    const month = Number(localDate[2]);
    const day = Number(localDate[1]);
    const parsed = new Date(Date.UTC(year, month - 1, day, 12));
    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
    return parsed;
  }

  const timestamp = Date.parse(text);
  return Number.isFinite(timestamp) ? saoPauloCalendarDate(new Date(timestamp)) : null;
}

export function formatScheduleDate(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BUSINESS_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric",
  }).format(value);
}

export function priorityIntervalDays(priority: number): number {
  const intervals: Record<number, number> = { 1: 60, 2: 90, 3: 120 };
  const interval = intervals[priority];
  if (!Number.isInteger(priority) || interval === undefined) throw new Error("Prioridade da busca deve ser 1, 2 ou 3.");
  return interval;
}

export function nextRunDate(lastRunAt: string | null | undefined, priority: number, now = new Date()): string {
  const parsed = parseScheduleDate(lastRunAt, now);
  if (!parsed) return "Agora";
  const base = parsed;
  return formatScheduleDate(new Date(base.getTime() + priorityIntervalDays(priority) * DAY_MS));
}

export function daysLate(nextRunAt: string | null | undefined, now = new Date()): number | null {
  const nextRun = parseScheduleDate(nextRunAt, now);
  if (!nextRun) return normalizeNextRun(nextRunAt) === "agora" ? 0 : null;
  const days = (saoPauloCalendarDate(now).getTime() - nextRun.getTime()) / DAY_MS;
  return days >= 0 ? days : null;
}

function normalizeNextRun(value: string | null | undefined): string {
  return value?.trim().toLocaleLowerCase("pt-BR") ?? "";
}
