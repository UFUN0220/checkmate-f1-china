import { describe, expect, it } from "vitest";
import { calculateHallOfFame } from "../analytics/metrics";
import {
  loadHallOfFameDataset,
  loadPeerDataset,
  ManualDatasetValidationError,
  validatePeerDataset,
} from "./manual-datasets";

describe("manual peer and hall datasets", () => {
  it("uses the fixed cutoff for pending records", () => {
    const dataset = loadPeerDataset([
      { id: "peer-real-1", startDate: "2026-08-01", status: "pending" },
    ]);
    expect(dataset.metadata).toMatchObject({ source: "peer", isMock: false, sampleSize: 1 });
    expect(dataset.cases[0]).toMatchObject({
      endDate: null,
      effectiveEndDate: "2026-08-31",
      durationDays: 30,
      status: "pending",
      isMock: false,
    });
  });

  it("derives resolved duration and reconstructs a future result", () => {
    const dataset = loadPeerDataset([
      { id: "peer-clear", startDate: "2026-08-01", status: "clear", endDate: "2026-08-10" },
      { id: "peer-future", startDate: "2026-07-01", status: "clear", endDate: "2026-09-10" },
    ]);
    expect(dataset.cases[0].durationDays).toBe(9);
    expect(dataset.cases[1]).toMatchObject({
      status: "pending",
      endDate: null,
      effectiveEndDate: "2026-08-31",
      durationDays: 61,
    });
  });

  it("fails closed for invalid dates, missing ends, and duplicate IDs", () => {
    expect(
      validatePeerDataset([
        { id: "duplicate", startDate: "2026-08-01", status: "pending" },
        { id: "duplicate", startDate: "2026-08-40", status: "clear" },
      ]),
    ).toMatchObject({ valid: false });
    expect(() =>
      loadPeerDataset([{ id: "missing-end", startDate: "2026-08-01", status: "reject" }]),
    ).toThrow(ManualDatasetValidationError);
  });

  it("falls back to mock data only when the manual file is empty", () => {
    const peer = loadPeerDataset([]);
    const hall = loadHallOfFameDataset([]);
    expect(peer.metadata).toMatchObject({ source: "peer", isMock: true, sampleSize: 100 });
    expect(hall.metadata).toMatchObject({ source: "hall-of-fame", isMock: true, sampleSize: 10 });
    expect(peer.cases.every((record) => record.isMock)).toBe(true);
    expect(hall.cases.every((record) => record.isMock)).toBe(true);
  });

  it("keeps hall data independent, derives duration, and selects the top ten", () => {
    const input = Array.from({ length: 11 }, (_, index) => ({
      id: `hall-real-${index + 1}`,
      displayName: `匿名同学 ${index + 1}`,
      startDate: "2026-01-01",
      status: "clear" as const,
      endDate: `2026-01-${String(2 + index).padStart(2, "0")}`,
      subtitle: "独立手工案例",
    }));
    const dataset = loadHallOfFameDataset(input);
    const topTen = calculateHallOfFame(dataset.cases);
    expect(dataset.metadata.isMock).toBe(false);
    expect(topTen).toHaveLength(10);
    expect(topTen[0].durationDays).toBeGreaterThan(topTen.at(-1)?.durationDays ?? 0);
    expect(topTen[0].displayName).toBe("匿名同学 11");
  });
});
