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
  if (!Number.isInteger(priority) || priority < 1) throw new Error("Prioridade da busca precisa ser um inteiro positivo.");
  return priority * 7;
}

export function nextRunDate(lastRunAt: string | null | undefined, priority: number, now = new Date()): string {
  const parsed = parseScheduleDate(lastRunAt, now);
  if (!parsed) return "Agora";
  const base = parsed;
  return formatScheduleDate(new Date(base.getTime() + priorityIntervalDays(priority) * DAY_MS));
}

export function urgency(lastRunAt: string | null | undefined, priority: number, now = new Date()): number {
  const lastRun = parseScheduleDate(lastRunAt, now);
  if (!lastRun) return Number.POSITIVE_INFINITY;
  const elapsedDays = Math.max(0, (saoPauloCalendarDate(now).getTime() - lastRun.getTime()) / DAY_MS);
  return elapsedDays / priorityIntervalDays(priority);
}
