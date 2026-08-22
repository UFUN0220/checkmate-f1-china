import { describe, expect, it } from "vitest";
import { calculateCohorts, calculateMetrics, median, percentile } from "./metrics";
import { DEMO_SNAPSHOT } from "../data/demo-snapshot";

describe("metrics", () => {
  it("calculates median and interpolated p75", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(percentile([1, 2, 3, 4], 0.75)).toBe(3.25);
    expect(median([])).toBeNull();
  });

  it("separates Pending age from Clear duration", () => {
    const metrics = calculateMetrics(DEMO_SNAPSHOT.cases);
    expect(metrics.pendingCount).toBe(18);
    expect(metrics.clearCount).toBe(14);
    expect(metrics.rejectCount).toBe(4);
    expect(metrics.resolvedSampleCount).toBe(14);
    expect(metrics.pendingAgeMedianDays).not.toBeNull();
    expect(metrics.resolvedDurationMedianDays).not.toBeNull();
    expect(metrics.sampleBand).toBe("standard");
  });

  it("classifies insufficient and small location samples", () => {
    expect(DEMO_SNAPSHOT.locations.shanghai.sampleBand).toBe("insufficient");
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
});
