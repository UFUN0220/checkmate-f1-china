import { describe, expect, it } from "vitest";
import { loadCheckeeSnapshot, loadPage2Snapshot } from "./loaders";

describe("snapshot loaders", () => {
  it("exposes the safe Checkee snapshot at the feature boundary", () => {
    const snapshot = loadCheckeeSnapshot();

    expect(snapshot.manifest.recordCount).toBe(503);
    expect(snapshot.manifest.dataOrigin).toBe("CHECKEE_HTML");
    expect(snapshot.cases).toHaveLength(503);
  });

  it("exposes the safe Page2 snapshot at the feature boundary", () => {
    const snapshot = loadPage2Snapshot();

    expect(snapshot.metrics.totalCases).toBe(97);
    expect(snapshot.metrics.waitingStats).toMatchObject({ q1: 54, median: 75, q3: 89 });
    expect(snapshot.cases).toHaveLength(97);
  });
});
