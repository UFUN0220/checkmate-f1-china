import { describe, expect, it } from "vitest";
import {
  calculateCohorts,
  calculateHallOfFame,
  calculateMonthlyF1Trends,
  calculateMetrics,
  calculateWaitStats,
  median,
  percentile,
  sortByCheckDateDescending,
} from "./metrics";
import { DEMO_SNAPSHOT } from "../data/demo-snapshot";

describe("metrics", () => {
  it("calculates median and interpolated p75", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(percentile([1, 2, 3, 4], 0.75)).toBe(3.25);
    expect(median([])).toBeNull();
  });

  it("calculates one shared Q1, median, and Q3 contract", () => {
    const stats = calculateWaitStats([
      { durationDays: 10 },
      { durationDays: 20 },
      { durationDays: 30 },
      { durationDays: 40 },
    ]);
    expect(stats).toEqual({ q1: 17.5, median: 25, q3: 32.5, sampleSize: 4 });
    expect(calculateWaitStats([{ durationDays: null }])).toEqual({
      q1: null,
      median: null,
      q3: null,
      sampleSize: 0,
    });
  });

  it("sorts Hall of Fame records by duration descending", () => {
    const records: Array<{ publicId: string; durationDays: number }> = [
      { publicId: "short", durationDays: 20 },
      { publicId: "long", durationDays: 230 },
      { publicId: "middle", durationDays: 80 },
    ];
    expect(calculateHallOfFame(records).map((record) => record.publicId)).toEqual([
      "long",
      "middle",
      "short",
    ]);
  });

  it("sorts city records by Check Date descending", () => {
    const records = [
      { publicId: "old", checkDate: "2026-01-03" },
      { publicId: "new", checkDate: "2026-08-18" },
      { publicId: "middle", checkDate: "2026-04-22" },
    ];
    expect(sortByCheckDateDescending(records).map((record) => record.publicId)).toEqual([
      "new",
      "middle",
      "old",
    ]);
  });

  it("separates Pending age from Clear duration", () => {
    const metrics = calculateMetrics(DEMO_SNAPSHOT.cases);
    expect(metrics.pendingCount).toBe(19);
    expect(metrics.clearCount).toBe(14);
    expect(metrics.rejectCount).toBe(4);
    expect(metrics.resolvedSampleCount).toBe(14);
    expect(metrics.pendingAgeMedianDays).not.toBeNull();
    expect(metrics.resolvedDurationMedianDays).not.toBeNull();
    expect(metrics.sampleBand).toBe("standard");
  });

  it("keeps wait stats sample size distinct from resolved duration semantics", () => {
    const metrics = calculateMetrics([
      {
        ...DEMO_SNAPSHOT.cases.find((item) => item.status === "clear")!,
        durationDays: 20,
        resolvedDurationDays: 20,
      },
      {
        ...DEMO_SNAPSHOT.cases.find((item) => item.status === "reject")!,
        durationDays: 40,
        resolvedDurationDays: null,
      },
    ]);
    expect(metrics.sampleCount).toBe(2);
    expect(metrics.waitStats.sampleSize).toBe(2);
    expect(metrics.resolvedSampleCount).toBe(1);
  });

  it("classifies insufficient and small location samples", () => {
    expect(DEMO_SNAPSHOT.locations.shanghai.sampleBand).toBe("small");
    expect(DEMO_SNAPSHOT.locations.wuhan.sampleBand).toBe("small");
    expect(DEMO_SNAPSHOT.locations.guangzhou.sampleBand).toBe("standard");
  });

  it("marks the current cohort partial and includes empty months", () => {
    const cohorts = calculateCohorts(DEMO_SNAPSHOT.cases, "2026-01", "2026-08");
    expect(cohorts).toHaveLength(8);
    expect(cohorts[0].month).toBe("2026-01");
    expect(cohorts.at(-1)?.month).toBe("2026-08");
    expect(cohorts.at(-1)?.partial).toBe(true);
  });

  it("calculates F1-only monthly snapshot metrics with the fixed snapshot date", () => {
    const trends = calculateMonthlyF1Trends(
      [
        {
          visaType: "F1",
          checkDate: "2026-01-01",
          completeDate: null,
          status: "pending",
          waitingDaysReported: 999,
        },
        {
          visaType: "F1",
          checkDate: "2026-01-10",
          completeDate: "2026-02-01",
          status: "clear",
          waitingDaysReported: 20,
        },
        {
          visaType: null,
          checkDate: "2026-01-15",
          completeDate: null,
          status: "pending",
          waitingDaysReported: 123,
        },
        {
          visaType: "F1",
          checkDate: "2026-02-01",
          completeDate: "2026-02-15",
          status: "clear",
          waitingDaysReported: 10,
        },
        {
          visaType: "F1",
          checkDate: "2026-02-03",
          completeDate: "2026-02-04",
          status: "reject",
          waitingDaysReported: 1,
        },
      ],
      "2026-09-01",
      "2026-01",
      "2026-08",
    );

    expect(trends).toHaveLength(8);
    expect(trends[0]).toEqual({
      month: "2026-01",
      pendingCount: 1,
      clearCount: 1,
      totalCount: 2,
      averageWaitingDays: 131.5,
      averageSampleSize: 2,
      waitingDaysTotal: 263,
    });
    expect(trends[1]).toMatchObject({
      pendingCount: 0,
      clearCount: 1,
      totalCount: 1,
      averageWaitingDays: 10,
    });
    expect(
      trends.every((trend) => trend.totalCount === trend.pendingCount + trend.clearCount),
    ).toBe(true);
  });
});
