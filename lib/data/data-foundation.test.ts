import { describe, expect, it } from "vitest";
import {
  CheckeeAccessDisabledError,
  CheckeeExportAdapter,
  CheckeeHtmlAdapter,
  DemoFixtureAdapter,
} from "./adapters";
import {
  normalizeLocation,
  normalizeStatus,
  normalizeVisaEntry,
  normalizeVisaType,
} from "./allowlists";
import { normalizeRawCase } from "./normalize";
import { DEMO_SNAPSHOT } from "./demo-snapshot";
import { CHECKEE_STATIC_SNAPSHOT } from "./static-snapshot";

const context = {
  origin: "CHECKEE_EXPORT" as const,
  fetchedAt: "2026-08-22T00:00:00Z",
  snapshotDate: "2026-08-22",
  rangeStart: "2026-01-01",
};

describe("source-independent data foundation", () => {
  it("normalizes explicit F-1, location, entry, and status aliases", () => {
    expect(normalizeVisaType("F-1")).toBe("F1");
    expect(normalizeVisaType("F")).toBeNull();
    expect(normalizeLocation("Bei Jing")).toBe("beijing");
    expect(normalizeVisaEntry("Renewal")).toBe("renewal");
    expect(normalizeStatus("Reject")).toBe("reject");
  });

  it("keeps date-derived durations authoritative and flags source mismatch", () => {
    const item = normalizeRawCase(
      {
        sourceRecordKeyInternal: "fixture-1",
        publicId: "fixture-1",
        visaTypeRaw: "F1",
        visaEntryRaw: "New",
        consulateRaw: "广州",
        majorRaw: "",
        sourceStatusRaw: "Pending",
        checkDate: "2026-08-01",
        completeDate: null,
        waitingDaysReported: 1,
        sourceMonth: "2026-07",
      },
      context,
    );
    expect(item.eligible).toBe(true);
    expect(item.majorCategory).toBe("Unknown");
    expect(item.dataQualityFlags).toEqual(["source_month_mismatch", "waiting_days_mismatch"]);
  });

  it("builds the demo snapshot without any Checkee request", async () => {
    const cases = await new DemoFixtureAdapter().load();
    expect(cases).toHaveLength(42);
    expect(DEMO_SNAPSHOT.manifest.demoData).toBe(true);
    expect(DEMO_SNAPSHOT.manifest.sourceName).toBe("DEMO_DATA");
    expect(DEMO_SNAPSHOT.manifest.includedCount).toBe(36);
    expect(DEMO_SNAPSHOT.manifest.statusCounts).toEqual({ pending: 18, clear: 14, reject: 4 });
    expect(DEMO_SNAPSHOT.manifest.locationCounts.shanghai).toBe(4);
    expect(DEMO_SNAPSHOT.qualityReport.monthConflictCount).toBe(1);
    expect(DEMO_SNAPSHOT.qualityReport.waitingDayMismatchCount).toBe(1);
    expect(DEMO_SNAPSHOT.qualityReport.duplicateCandidateCount).toBe(1);
    expect(DEMO_SNAPSHOT.cohorts.at(-1)?.partial).toBe(true);
  });

  it("supports a small JSON export adapter", async () => {
    const adapter = new CheckeeExportAdapter(
      JSON.stringify([
        {
          source_key: "export-1",
          visa_type: "F1",
          visa_entry: "New",
          consulate: "Shanghai",
          major: "Computer Science",
          status: "Pending",
          check_date: "2026-08-02",
          source_month: "2026-08",
        },
      ]),
      context,
    );
    const cases = await adapter.load();
    expect(cases[0].location).toBe("shanghai");
    expect(cases[0].status).toBe("pending");
  });

  it("refuses real Checkee access by default", async () => {
    await expect(new CheckeeHtmlAdapter("disabled").load()).rejects.toBeInstanceOf(
      CheckeeAccessDisabledError,
    );
  });

  it("locks the static snapshot to an exclusive disposition equation", () => {
    const quality = CHECKEE_STATIC_SNAPSHOT.qualityReport;
    const dispositionTotal = Object.values(quality.exclusiveDispositionCounts).reduce(
      (sum, count) => sum + count,
      0,
    );
    expect(dispositionTotal).toBe(quality.totalCandidates);
    expect(quality.exclusiveDispositionCounts).toMatchObject({
      included: 475,
      non_f1: 835,
      unknown_location: 28,
      duplicate: 125,
    });
    expect(quality.includedCount + quality.duplicateRemovalCount + 835 + 28).toBe(1463);
    expect(quality.exactDuplicateCount).toBe(5);
    expect(quality.possibleDuplicateCount).toBe(10);
    expect(quality.duplicateKeyGroupCount).toBe(76);
  });

  it("reconciles monthly cohorts with the national snapshot", () => {
    expect(
      CHECKEE_STATIC_SNAPSHOT.cohorts.reduce((sum, cohort) => sum + cohort.sampleCount, 0),
    ).toBe(CHECKEE_STATIC_SNAPSHOT.national.sampleCount);
    expect(CHECKEE_STATIC_SNAPSHOT.cohorts.at(-1)?.partial).toBe(true);
    expect(
      CHECKEE_STATIC_SNAPSHOT.locations.beijing.sampleCount +
        CHECKEE_STATIC_SNAPSHOT.locations.shanghai.sampleCount +
        CHECKEE_STATIC_SNAPSHOT.locations.guangzhou.sampleCount +
        CHECKEE_STATIC_SNAPSHOT.locations.shenyang.sampleCount +
        CHECKEE_STATIC_SNAPSHOT.locations.wuhan.sampleCount,
    ).toBe(CHECKEE_STATIC_SNAPSHOT.national.sampleCount);
  });
});
