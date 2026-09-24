import { describe, expect, it } from "vitest";
import { formatScheduleDate, nextRunDate, parseScheduleDate, priorityIntervalDays, urgency } from "../src/rotation/frequency.js";

const now = new Date("2026-09-23T12:00:00-03:00");

describe("search frequency dates", () => {
  it("formats due dates in Sao Paulo time and marks never-run searches as due now", () => {
    expect(formatScheduleDate(now)).toBe("23/09/2026");
    expect(nextRunDate(null, 1, now)).toBe("Agora");
  });

  it("calculates the next run from last execution and priority", () => {
    expect(nextRunDate("16/09/2026", 1, now)).toBe("23/09/2026");
    expect(nextRunDate("09/09/2026", 2, now)).toBe("23/09/2026");
    expect(nextRunDate("02/09/2026", 3, now)).toBe("23/09/2026");
  });

  it("parses ISO history while preserving the Sao Paulo calendar day", () => {
    expect(formatScheduleDate(parseScheduleDate("2026-09-23T01:00:00.000Z")!)).toBe("22/09/2026");
  });

  it("gives not-yet-due searches lower urgency than searches at their interval", () => {
    expect(urgency("22/09/2026", 1, now)).toBeLessThan(1);
    expect(urgency("16/09/2026", 1, now)).toBe(1);
    expect(priorityIntervalDays(3)).toBe(21);
  });
});
