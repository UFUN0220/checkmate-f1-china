import { describe, expect, it } from "vitest";
import {
  calculatePage2Metrics,
  calculatePage2WaitingDays,
  mergePage2Info,
  normalizeExcelDate,
  normalizePage2Rows,
} from "./page2";

describe("Page2 data normalization", () => {
  it("normalizes Excel serial and supported date text", () => {
    expect(normalizeExcelDate(46119)).toBe("2026-04-07");
    expect(normalizeExcelDate("2026/04/07")).toBe("2026-04-07");
    expect(normalizeExcelDate("04/07/2026")).toBe("2026-04-07");
    expect(normalizeExcelDate("not-a-date")).toBeNull();
  });

  it("calculates calendar-day waiting time and rejects reversed dates", () => {
    expect(calculatePage2WaitingDays("2026-08-31", "2026-09-01")).toBe(1);
    expect(calculatePage2WaitingDays("2026-09-01", "2026-09-01")).toBe(0);
    expect(() => calculatePage2WaitingDays("2026-09-02", "2026-09-01")).toThrow("cannot precede");
  });

  it("merges non-empty source values with semicolons", () => {
    expect(mergePage2Info(["Master", "", "STEM"])).toBe("Master; STEM");
    expect(mergePage2Info(["Master", "CS", "STEM"])).toBe("Master; CS; STEM");
    expect(mergePage2Info(["", null, undefined])).toBeNull();
  });

  it("normalizes statuses, fills blank end dates, and suppresses merged info", () => {
    const snapshot = normalizePage2Rows(
      [
        {
          startDate: "2026-08-31",
          endDate: null,
          status: "Check",
          mergedValues: ["School", "note", "contact"],
          degree: "Master",
          major: "CS",
        },
        {
          startDate: "2026-08-01",
          endDate: "2026-08-10",
          status: "Approve",
          mergedValues: [],
          degree: null,
          major: null,
        },
        {
          startDate: null,
          endDate: null,
          status: "Approve",
          mergedValues: [],
          degree: null,
          major: null,
        },
        {
          startDate: "2026-08-02",
          endDate: null,
          status: "Unknown",
          mergedValues: [],
          degree: null,
          major: null,
        },
        {
          startDate: null,
          endDate: null,
          status: null,
          mergedValues: [],
          degree: null,
          major: null,
          isBlank: true,
        },
      ],
      "2026-09-01",
    );

    expect(snapshot.cases).toHaveLength(2);
    expect(snapshot.cases[0].startDate).toBe("2026-08-01");
    expect(snapshot.cases[0].waitingDays).toBe(9);
    expect(snapshot.cases[1].effectiveEndDate).toBe("2026-09-01");
    expect(snapshot.cases[1].waitingDays).toBe(1);
    expect(snapshot.cases.every((item) => item.mergedInfo === null)).toBe(true);
    expect(snapshot.metadata.blankRows).toBe(1);
    expect(snapshot.metadata.invalidRows).toBe(2);
    expect(snapshot.metadata.unknownStatusRows).toBe(1);
    expect(snapshot.metadata.privacySuppressedInfoRows).toBe(1);
  });

  it("reconciles Page2 metrics from normalized cases", () => {
    const cases = normalizePage2Rows(
      [
        {
          startDate: "2026-08-01",
          endDate: "2026-08-03",
          status: "Approve",
          mergedValues: [],
          degree: null,
          major: null,
        },
        {
          startDate: "2026-08-02",
          endDate: null,
          status: "Check",
          mergedValues: [],
          degree: null,
          major: null,
        },
      ],
      "2026-09-01",
    ).cases;

    expect(calculatePage2Metrics(cases)).toEqual({
      totalCases: 2,
      approvedCases: 1,
      pendingOrOtherCases: 1,
      waitingDaysTotal: 32,
      waitingDaysSampleSize: 2,
      averageWaitingDays: 16,
    });
  });
});
