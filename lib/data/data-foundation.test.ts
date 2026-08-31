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
import { calculateDurationDays, normalizeRawCase } from "./normalize";
import { DEMO_SNAPSHOT } from "./demo-snapshot";
import { buildPublicSnapshot } from "./public-snapshot";
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

  it("uses the fixed snapshot cutoff for every Pending duration", () => {
    const item = normalizeRawCase(
      {
        sourceRecordKeyInternal: "cutoff-pending",
        publicId: "cutoff-pending",
        visaTypeRaw: "F1",
        visaEntryRaw: "New",
        consulateRaw: "北京",
        majorRaw: "Computer Science",
        sourceStatusRaw: "Pending",
        checkDate: "2026-08-01",
        completeDate: null,
        waitingDaysReported: 1,
        sourceMonth: "2026-08",
      },
      { ...context, snapshotDate: "2026-08-31" },
    );
    expect(item.eligible).toBe(true);
    expect(item.waitingDaysReported).toBe(1);
    const snapshot = buildPublicSnapshot([item], {
      sourceName: "fixture",
      sourceUrl: "offline://fixture",
      sourceMode: "demo-fixture",
      dataOrigin: "DEMO_DATA",
      accessStatus: "DEMO_DATA",
      rangeStart: "2026-01-01",
      rangeEnd: "2026-08",
      coverageFrom: "2026-01",
      coverageThrough: "2026-08",
      sourceMonths: ["2026-08"],
      importedAt: "2026-08-31T00:00:00Z",
      fetchedAt: "2026-08-31T00:00:00Z",
      snapshotDate: "2026-08-31",
      parserVersion: "fixture-v1",
      rawPageCount: 0,
      currentMonthPartial: true,
      demoData: true,
      schemaVersion: "fixture-v1",
      isLive: false,
    });
    expect(snapshot.cases[0]).toMatchObject({
      effectiveEndDate: "2026-08-31",
      durationDays: 30,
      pendingAgeDays: 30,
      pendingAgeSource: "derived_snapshot_date",
      durationSource: "cutoff_date",
    });
  });

  it("reconstructs a future result as Pending at the snapshot cutoff", () => {
    const item = normalizeRawCase(
      {
        sourceRecordKeyInternal: "future-result",
        publicId: "future-result",
        visaTypeRaw: "F1",
        visaEntryRaw: "New",
        consulateRaw: "北京",
        majorRaw: "Computer Science",
        sourceStatusRaw: "Clear",
        checkDate: "2026-07-01",
        completeDate: "2026-09-10",
        waitingDaysReported: null,
        sourceMonth: "2026-07",
      },
      { ...context, snapshotDate: "2026-08-31" },
    );
    expect(item.eligible).toBe(true);
    expect(item.dataQualityFlags).toContain("future_complete_date");
    const snapshot = buildPublicSnapshot([item], {
      sourceName: "fixture",
      sourceUrl: "offline://fixture",
      sourceMode: "manual-html-static",
      dataOrigin: "CHECKEE_HTML",
      accessStatus: "CHECKEE_ACCESS_BLOCKED",
      rangeStart: "2026-01-01",
      rangeEnd: "2026-08",
      coverageFrom: "2026-01",
      coverageThrough: "2026-08",
      sourceMonths: ["2026-07"],
      importedAt: "2026-08-31T00:00:00Z",
      fetchedAt: "2026-08-31T00:00:00Z",
      snapshotDate: "2026-08-31",
      parserVersion: "fixture-v1",
      rawPageCount: 1,
      currentMonthPartial: true,
      demoData: false,
      schemaVersion: "fixture-v1",
      isLive: false,
    });
    expect(snapshot.cases[0]).toMatchObject({
      status: "pending",
      completeDate: null,
      effectiveEndDate: "2026-08-31",
      durationDays: 61,
      pendingAgeDays: 61,
      durationSource: "cutoff_date",
    });
  });

  it("fails closed when a resolved record has no end date", () => {
    const item = normalizeRawCase(
      {
        sourceRecordKeyInternal: "missing-reject-end",
        publicId: "missing-reject-end",
        visaTypeRaw: "F1",
        visaEntryRaw: "New",
        consulateRaw: "上海",
        majorRaw: "Business",
        sourceStatusRaw: "Reject",
        checkDate: "2026-07-01",
        completeDate: null,
        waitingDaysReported: null,
        sourceMonth: "2026-07",
      },
      { ...context, snapshotDate: "2026-08-31" },
    );
    expect(item.eligible).toBe(false);
    expect(item.exclusionReason).toBe("incomplete_record");
    expect(item.dataQualityFlags).toContain("missing_complete_date");
  });

  it("uses calendar-day duration with same-day cases equal to zero", () => {
    expect(calculateDurationDays("2026-08-31", "2026-08-31")).toBe(0);
    expect(calculateDurationDays("2026-08-01", "2026-08-31")).toBe(30);
    expect(calculateDurationDays("2026-08-31", "2026-08-01")).toBe(-30);
  });

  it("builds the demo snapshot without any Checkee request", async () => {
    const cases = await new DemoFixtureAdapter().load();
    expect(cases).toHaveLength(42);
    expect(DEMO_SNAPSHOT.manifest.demoData).toBe(true);
    expect(DEMO_SNAPSHOT.manifest.sourceName).toBe("DEMO_DATA");
    expect(DEMO_SNAPSHOT.manifest.includedCount).toBe(37);
    expect(DEMO_SNAPSHOT.manifest.statusCounts).toEqual({ pending: 19, clear: 14, reject: 4 });
    expect(DEMO_SNAPSHOT.manifest.locationCounts.shanghai).toBe(5);
    expect(DEMO_SNAPSHOT.qualityReport.monthConflictCount).toBe(1);
    expect(DEMO_SNAPSHOT.qualityReport.waitingDayMismatchCount).toBe(3);
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
      included: 503,
      non_f1: 856,
      unknown_location: 28,
      duplicate: 132,
    });
    expect(quality.includedCount + quality.duplicateRemovalCount + 856 + 28).toBe(1519);
    expect(quality.exactDuplicateCount).toBe(5);
    expect(quality.possibleDuplicateCount).toBe(12);
    expect(quality.duplicateKeyGroupCount).toBe(78);
  });

  it("reconciles monthly cohorts with the national snapshot", () => {
    expect(CHECKEE_STATIC_SNAPSHOT.manifest.snapshotDate).toBe("2026-09-01");
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
    expect(
      CHECKEE_STATIC_SNAPSHOT.monthlyF1Trends.reduce((sum, trend) => sum + trend.totalCount, 0),
    ).toBe(
      CHECKEE_STATIC_SNAPSHOT.manifest.statusCounts.pending +
        CHECKEE_STATIC_SNAPSHOT.manifest.statusCounts.clear,
    );
  });
});
