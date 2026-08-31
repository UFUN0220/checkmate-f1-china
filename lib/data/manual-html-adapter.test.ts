import path from "node:path";
import { describe, expect, it } from "vitest";
import { ManualCheckeeHtmlAdapter, ManualHtmlSchemaError } from "./manual-html-adapter";
import { buildPublicSnapshot } from "./public-snapshot";

const fixtureDir = path.resolve("scripts/fixtures/checkee-static");
const options = {
  importedAt: "2026-08-23T00:00:00Z",
  snapshotDate: "2026-08-31",
  rangeStart: "2026-01-01",
  waitingDaysReferenceDate: null,
} as const;

describe("ManualCheckeeHtmlAdapter", () => {
  it("parses the saved table structure and reports exclusions without exposing source fields", async () => {
    const result = await new ManualCheckeeHtmlAdapter(
      [path.join(fixtureDir, "2601.html"), path.join(fixtureDir, "2602.html")],
      options,
    ).loadDetailed();

    expect(result.rawRowCount).toBe(11);
    expect(result.cases).toHaveLength(10);
    expect(result.isolations).toEqual([
      { fileName: "2602.html", rowNumber: 5, reason: "invalid_waiting_days" },
    ]);
    expect(result.exactDuplicateCount).toBe(1);
    expect(result.possibleDuplicateCount).toBe(1);
    expect(result.duplicateKeyGroupCount).toBe(1);
    expect(result.duplicateGroups[0]).toMatchObject({
      candidateCount: 2,
      sourceKeyCount: 1,
      exactDuplicateRows: 1,
      verdict: "CONFIRMED_DUPLICATE",
    });
    expect(result.fileReports[0]).toMatchObject({
      sourceMonth: "2026-01",
      tableCount: 2,
      headers: [
        "Update",
        "ID",
        "Visa Type",
        "Visa Entry",
        "US Consulate",
        "Major",
        "Status",
        "Check Date",
        "Complete Date",
        "Waiting Day(s)",
        "Details",
      ],
      sensitiveColumns: ["id", "details"],
      parsedRowCount: 7,
      isolatedRowCount: 0,
    });

    const pending = result.cases.find((item) => item.sourceRecordKeyInternal === "checkee-id:1001");
    expect(pending).toMatchObject({
      visaType: "F1",
      location: "beijing",
      status: "pending",
      completeDate: null,
      dataQualityFlags: [],
    });
    expect(
      result.cases.find((item) => item.sourceRecordKeyInternal === "checkee-id:1004")?.eligible,
    ).toBe(false);
    expect(
      result.cases.find((item) => item.sourceRecordKeyInternal === "checkee-id:2001")
        ?.exclusionReason,
    ).toBe("invalid_date");
    expect(
      result.cases.find((item) => item.sourceRecordKeyInternal === "checkee-id:2002")
        ?.exclusionReason,
    ).toBe("unknown_status");

    const snapshot = buildPublicSnapshot(result.cases, {
      sourceName: "Checkee.info",
      sourceUrl: "https://www.checkee.info/",
      sourceMode: "manual-html-static",
      dataOrigin: "CHECKEE_HTML",
      accessStatus: "CHECKEE_ACCESS_BLOCKED",
      rangeStart: "2026-01-01",
      rangeEnd: "2026-02",
      coverageFrom: "2026-01",
      coverageThrough: "2026-02",
      sourceMonths: ["2026-01", "2026-02"],
      importedAt: options.importedAt,
      fetchedAt: options.importedAt,
      snapshotDate: options.snapshotDate,
      parserVersion: "manual-checkee-html-v1",
      rawPageCount: 2,
      currentMonthPartial: true,
      demoData: false,
      schemaVersion: "3b-static-html-v1",
      isLive: false,
      exactDuplicateCount: result.exactDuplicateCount,
      possibleDuplicateCount: result.possibleDuplicateCount,
    });
    const publicJson = JSON.stringify(snapshot);
    expect(publicJson).not.toContain("1001");
    expect(publicJson).not.toContain("details");
    expect(snapshot.cases.every((item) => item.publicId.startsWith("case-"))).toBe(true);
    expect(snapshot.cases.find((item) => item.status === "pending")?.pendingAgeSource).toBe(
      "derived_snapshot_date",
    );
  });

  it("fails closed for remote paths and schema drift", async () => {
    expect(
      () => new ManualCheckeeHtmlAdapter(["https://www.checkee.info/2601.html"], options),
    ).toThrow(ManualHtmlSchemaError);
    await expect(
      new ManualCheckeeHtmlAdapter([path.join(fixtureDir, "2603.html")], options).load(),
    ).rejects.toThrow(/Header details/);
  });
});
