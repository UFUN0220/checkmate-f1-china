import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { ManualCheckeeHtmlAdapter } from "../lib/data/manual-html-adapter";
import { buildPublicSnapshot } from "../lib/data/public-snapshot";
import { normalizeLocation, normalizeVisaEntry, normalizeVisaType } from "../lib/data/allowlists";
import { calculateDurationDays } from "../lib/data/normalize";
import { LOCATIONS, type NormalizedCase, type PublicSnapshot } from "../lib/data/models";
import { DATA_SNAPSHOT } from "../lib/data/snapshot-config";

const IMPORTED_AT = DATA_SNAPSHOT.timestamp;
const SOURCE_MONTHS = Array.from(
  { length: 8 },
  (_, index) => `2026-${String(index + 1).padStart(2, "0")}`,
);
const SOURCE_DIR = path.resolve("data/raw");
const NORMALIZED_OUTPUT = path.resolve("data/normalized/public-f1-checks.json");
const NORMALIZED_META_OUTPUT = path.resolve("data/normalized/public-f1-checks.meta.json");
const VALIDATION_REPORT_OUTPUT = path.resolve("docs/data-validation-report-2026-09-01.md");

function inputPaths() {
  const requestedDir = path.resolve(process.env.CHECKEE_HTML_DIR ?? SOURCE_DIR);
  if (requestedDir !== SOURCE_DIR) {
    throw new Error(`Stage 3E accepts local HTML from data/raw only; received ${requestedDir}.`);
  }
  const files = SOURCE_MONTHS.map((month) =>
    path.join(SOURCE_DIR, `${month.slice(2).replace("-", "")}.html`),
  );
  if (!existsSync(SOURCE_DIR)) {
    throw new Error(`Stage 3E input missing: ${SOURCE_DIR}. No network fallback is allowed.`);
  }
  const missing = files.filter((filePath) => !existsSync(filePath));
  if (missing.length) {
    throw new Error(`Stage 3E input incomplete; missing local HTML: ${missing.join(", ")}`);
  }
  return files;
}

function options() {
  return {
    importedAt: process.env.CHECKEE_IMPORT_AT ?? IMPORTED_AT,
    snapshotDate: DATA_SNAPSHOT.cutoffDate,
    rangeStart: "2026-01-01",
    waitingDaysReferenceDate: null,
  } as const;
}

async function load() {
  const adapter = new ManualCheckeeHtmlAdapter(inputPaths(), options());
  return adapter.loadDetailed();
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function cleanCell(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeader(value: string) {
  return cleanCell(value).toLowerCase();
}

function sampleAudit(result: Awaited<ReturnType<typeof load>>) {
  const fields = [
    "visaTypeRaw",
    "visaEntryRaw",
    "consulateRaw",
    "majorRaw",
    "sourceStatusRaw",
    "checkDate",
    "completeDate",
    "waitingDaysReported",
    "sourceMonth",
  ];
  const fieldMatches = Object.fromEntries(fields.map((field) => [field, 0]));
  const fieldMismatches = Object.fromEntries(fields.map((field) => [field, 0]));
  const sampledByMonth: Record<string, number> = {};
  const inventory = new Map<string, { populated: number; values: Set<string> }>();
  for (const field of [
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
  ])
    inventory.set(field, { populated: 0, values: new Set<string>() });
  const coverage = {
    statuses: new Set<string>(),
    locations: new Set<string>(),
    entries: new Set<string>(),
    visaAliases: new Set<string>(),
    hasMajor: new Set<string>(),
    hasCompleteDate: new Set<string>(),
  };
  let sampledRecords = 0;
  for (const filePath of inputPaths()) {
    const fileName = path.basename(filePath);
    const sourceMonth = `2026-${fileName.slice(2, 4)}`;
    const html = readFileSync(filePath, "utf8");
    const document = new JSDOM(html).window.document;
    const table = [...document.querySelectorAll("table")].find((candidate) => {
      const headers = [...candidate.querySelectorAll("tr")].at(0)?.children ?? [];
      const values = [...headers].map((cell) => normalizeHeader(cell.textContent ?? ""));
      return values.includes("visa type") && values.includes("check date");
    });
    if (!table) throw new Error(`Sample audit table missing in ${fileName}`);
    const rows = [...table.querySelectorAll("tr")].slice(1).filter((row) => {
      const text = cleanCell(row.textContent ?? "");
      return !(/Visa Type/i.test(text) && /Check Date/i.test(text));
    });
    const headers = [...table.querySelectorAll("tr")].at(0)?.children ?? [];
    const indexes = new Map(
      [...headers].map((cell, index) => [normalizeHeader(cell.textContent ?? ""), index]),
    );
    const valueAt = (cells: Element[], header: string) =>
      cleanCell(cells[indexes.get(header) ?? -1]?.textContent ?? "");
    const candidates = rows
      .map((row, index) => {
        const cells = [...row.children];
        const visaTypeRaw = valueAt(cells, "visa type");
        const visaEntryRaw = valueAt(cells, "visa entry");
        const consulateRaw = valueAt(cells, "us consulate");
        const majorRaw = valueAt(cells, "major");
        const sourceStatusRaw = valueAt(cells, "status");
        const checkDate = valueAt(cells, "check date");
        const completeDateCell = valueAt(cells, "complete date");
        const completeDate = /^(?:0000-00-00|n\/a|na|null|unknown)$/i.test(completeDateCell)
          ? ""
          : completeDateCell;
        const waitingDaysReported = Number(valueAt(cells, "waiting day(s)"));
        const coverageTokens = new Set([
          `status:${sourceStatusRaw}`,
          `location:${consulateRaw}`,
          `entry:${visaEntryRaw}`,
          `alias:${visaTypeRaw}`,
          `major:${majorRaw ? "present" : "empty"}`,
          `complete:${completeDate ? "present" : "empty"}`,
          `waiting:${waitingDaysReported}`,
        ]);
        return {
          rowNumber: index + 2,
          cells,
          inventoryFields: {
            Update: valueAt(cells, "update"),
            ID: valueAt(cells, "id"),
            "Visa Type": visaTypeRaw,
            "Visa Entry": visaEntryRaw,
            "US Consulate": consulateRaw,
            Major: majorRaw,
            Status: sourceStatusRaw,
            "Check Date": checkDate,
            "Complete Date": completeDate,
            "Waiting Day(s)": valueAt(cells, "waiting day(s)"),
            Details: valueAt(cells, "details"),
          },
          fields: {
            visaTypeRaw,
            visaEntryRaw: visaEntryRaw || null,
            consulateRaw,
            majorRaw: majorRaw || null,
            sourceStatusRaw,
            checkDate: checkDate || null,
            completeDate: completeDate || null,
            waitingDaysReported,
            sourceMonth,
          },
          coverageTokens,
        };
      })
      .filter(
        (candidate) =>
          candidate.cells.length === 11 &&
          Number.isSafeInteger(candidate.fields.waitingDaysReported),
      );
    for (const candidate of candidates) {
      for (const [field, value] of Object.entries(candidate.inventoryFields)) {
        const entry = inventory.get(field);
        if (!entry) continue;
        if (value) entry.populated += 1;
        entry.values.add(value);
      }
    }
    const selected = new Set<number>();
    const localCoverage = new Set<string>();
    const recordSample = (candidate: (typeof candidates)[number]) => {
      selected.add(candidate.rowNumber);
      for (const token of candidate.coverageTokens) {
        localCoverage.add(token);
        const [kind, value] = token.split(":");
        if (kind === "status") coverage.statuses.add(value);
        if (kind === "location") coverage.locations.add(value);
        if (kind === "entry") coverage.entries.add(value);
        if (kind === "alias") coverage.visaAliases.add(value);
        if (kind === "major") coverage.hasMajor.add(value);
        if (kind === "complete") coverage.hasCompleteDate.add(value);
      }
      const normalized = result.cases.find(
        (item) =>
          item.sourceFileName === fileName &&
          item.publicId === `html-${fileName}-${candidate.rowNumber}`,
      );
      if (!normalized) throw new Error(`Sample audit normalized row missing in ${fileName}`);
      sampledRecords += 1;
      sampledByMonth[sourceMonth] = (sampledByMonth[sourceMonth] ?? 0) + 1;
      for (const field of fields) {
        const rawValue = candidate.fields[field as keyof typeof candidate.fields];
        const normalizedValue = normalized[field as keyof typeof normalized];
        if (String(rawValue ?? "") === String(normalizedValue ?? "")) fieldMatches[field] += 1;
        else fieldMismatches[field] += 1;
      }
      normalizeVisaType(candidate.fields.visaTypeRaw);
      normalizeLocation(candidate.fields.consulateRaw);
      normalizeVisaEntry(candidate.fields.visaEntryRaw);
    };
    for (const requiredToken of [
      "major:empty",
      "major:present",
      "complete:empty",
      "complete:present",
    ]) {
      const required = candidates.find(
        (candidate) =>
          candidate.coverageTokens.has(requiredToken) && !selected.has(candidate.rowNumber),
      );
      if (required) recordSample(required);
    }
    while (selected.size < Math.min(10, candidates.length)) {
      const next = candidates
        .filter((candidate) => !selected.has(candidate.rowNumber))
        .map((candidate) => ({
          candidate,
          score: [...candidate.coverageTokens].filter((token) => !localCoverage.has(token)).length,
        }))
        .sort(
          (left, right) =>
            right.score - left.score || left.candidate.rowNumber - right.candidate.rowNumber,
        )[0];
      if (!next) break;
      recordSample(next.candidate);
    }
  }
  return {
    sampledRecords,
    fieldsPerRecord: fields.length,
    fieldsChecked: sampledRecords * fields.length,
    fieldMatches,
    fieldMismatches,
    fieldInventory: [
      ["Update", "hidden_technical", "no", "—"],
      ["ID", "sourceRecordKeyInternal", "no", "—"],
      ["Visa Type", "visaType", "no", "primary"],
      ["Visa Entry", "visaEntry", "yes", "caseList"],
      ["US Consulate", "location", "yes", "primary"],
      ["Major", "degree + majorGroup + majorCategory", "no", "secondary"],
      ["Status", "status", "yes", "primary"],
      ["Check Date", "checkDate", "yes", "primary"],
      ["Complete Date", "completeDate", "no", "secondary"],
      ["Waiting Day(s)", "waitingDaysReported; audit only", "no", "secondary"],
      ["Details", "hidden_technical", "no", "—"],
    ].map(([field, model, displayed, priority]) => {
      const entry = inventory.get(field);
      return {
        field,
        parsed: true,
        dataCompleteness: entry ? entry.populated / result.rawRowCount : 0,
        uniqueValueCount: entry?.values.size ?? 0,
        standardModel: model,
        displayed,
        priority,
      };
    }),
    sampledByMonth,
    coverage: {
      statuses: [...coverage.statuses].sort(),
      locations: [...coverage.locations].sort(),
      entries: [...coverage.entries].sort(),
      visaAliases: [...coverage.visaAliases].sort(),
      majorPresence: [...coverage.hasMajor].sort(),
      completeDatePresence: [...coverage.hasCompleteDate].sort(),
    },
  };
}

function buildSnapshot(result: Awaited<ReturnType<typeof load>>) {
  return buildPublicSnapshot(result.cases, {
    sourceName: "Checkee.info",
    sourceUrl: "https://www.checkee.info/",
    sourceMode: "manual-html-static",
    dataOrigin: "CHECKEE_HTML",
    accessStatus: "CHECKEE_ACCESS_BLOCKED",
    rangeStart: "2026-01-01",
    rangeEnd: "2026-08",
    coverageFrom: "2026-01",
    coverageThrough: "2026-08",
    sourceMonths: SOURCE_MONTHS,
    fetchedAt: options().importedAt,
    importedAt: options().importedAt,
    snapshotDate: options().snapshotDate,
    parserVersion: "manual-checkee-html-v1",
    schemaVersion: "3b-static-html-v1",
    rawPageCount: SOURCE_MONTHS.length,
    currentMonthPartial: true,
    demoData: false,
    isLive: false,
    quarantinedCount: result.isolations.length,
    exactDuplicateCount: result.exactDuplicateCount,
    possibleDuplicateCount: result.possibleDuplicateCount,
  });
}

function statusAsOfSnapshot(item: NormalizedCase, snapshotDate: string) {
  return item.status === "pending" ||
    (item.completeDate !== null && item.completeDate > snapshotDate)
    ? "pending"
    : item.status;
}

function dedupeBySourceKey(records: NormalizedCase[]) {
  const seen = new Set<string>();
  return records.filter((item) => {
    if (seen.has(item.sourceRecordKeyInternal)) return false;
    seen.add(item.sourceRecordKeyInternal);
    return true;
  });
}

function buildNormalizedPublicCases(records: NormalizedCase[], snapshotDate: string) {
  return dedupeBySourceKey(records)
    .filter(
      (item) =>
        item.eligible &&
        item.visaType === "F1" &&
        item.location !== null &&
        item.status !== "unknown" &&
        item.checkDate !== null,
    )
    .map((item) => {
      const snapshotStatus = statusAsOfSnapshot(item, snapshotDate);
      const effectiveEndDate = snapshotStatus === "pending" ? snapshotDate : item.completeDate;
      return {
        ...item,
        source: "checkee" as const,
        sourceRecordId: item.sourceRecordKeyInternal,
        sourceFile: item.sourceFileName,
        rawStatus: item.sourceStatusRaw,
        currentStatus: item.status,
        snapshotStatus,
        status: snapshotStatus,
        effectiveEndDate,
        durationDays: effectiveEndDate
          ? calculateDurationDays(item.checkDate as string, effectiveEndDate)
          : null,
        isMock: false as const,
      };
    });
}

function displayNumber(value: number | null) {
  return value === null ? "n/a" : Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function cityValidationLines(snapshot: PublicSnapshot, deduped: NormalizedCase[]) {
  return LOCATIONS.map((location) => {
    const records = snapshot.cases.filter((item) => item.location === location);
    const candidates = deduped.filter(
      (item) => item.visaType === "F1" && item.location === location,
    );
    const durations = records.flatMap((item) =>
      item.durationDays === null ? [] : [item.durationDays],
    );
    const sorted = [...durations].sort((left, right) => left - right);
    const metrics = snapshot.locations[location];
    return [
      `## ${location[0].toUpperCase()}${location.slice(1)}`,
      "",
      `Sample size: ${records.length}`,
      `Pending: ${metrics.pendingCount}`,
      `Resolved: ${metrics.clearCount + metrics.rejectCount}`,
      `Approved (Clear): ${metrics.clearCount}`,
      `Refused (Reject): ${metrics.rejectCount}`,
      `Invalid excluded: ${Math.max(0, candidates.length - records.length)}`,
      "",
      `Q1: ${displayNumber(metrics.waitStats.q1)} days`,
      `Median: ${displayNumber(metrics.waitStats.median)} days`,
      `Q3: ${displayNumber(metrics.waitStats.q3)} days`,
      `Minimum: ${displayNumber(sorted[0] ?? null)} days`,
      `Maximum: ${displayNumber(sorted.at(-1) ?? null)} days`,
      "",
    ].join("\n");
  }).join("\n");
}

function buildValidationReport(result: Awaited<ReturnType<typeof load>>, snapshot: PublicSnapshot) {
  const deduped = dedupeBySourceKey(result.cases);
  const duplicateRemoved = result.cases.length - deduped.length;
  const nonDuplicateExcluded =
    result.rawRowCount - snapshot.cases.length - duplicateRemoved - result.isolations.length;
  const accounted =
    snapshot.cases.length + nonDuplicateExcluded + duplicateRemoved + result.isolations.length;
  const futureResultCount = result.cases.filter((item) =>
    item.dataQualityFlags.includes("future_complete_date"),
  ).length;
  const unresolvedDuplicateGroups = result.duplicateGroups.filter(
    (group) => group.verdict === "UNRESOLVED_KEEP_BOTH",
  ).length;
  const quality = snapshot.qualityReport;
  const manifest = snapshot.manifest;
  const mapping = [
    ["Update", "local audit metadata; not displayed"],
    ["ID", "sourceRecordKeyInternal; local provenance only"],
    ["Visa Type", "visaTypeRaw → explicit F1 allowlist"],
    ["Visa Entry", "visaEntryRaw → visaEntry"],
    ["US Consulate", "consulateRaw → explicit five-city allowlist"],
    ["Major", "majorRaw → degree / majorGroup / majorCategory"],
    ["Status", "sourceStatusRaw → status"],
    ["Check Date", "checkDate → YYYY-MM-DD"],
    ["Complete Date", "completeDate → YYYY-MM-DD; future result reconstructed"],
    ["Waiting Day(s)", "audit-only source field; duration uses effectiveEndDate"],
    ["Details", "local raw provenance only; never public"],
  ];
  const files = result.fileReports
    .map((file) => `| ${file.fileName} | ${file.dataTableRowCount} | ${file.sha256} |`)
    .join("\n");
  const excludedReasons = [
    ["Non-F1", quality.exclusiveDispositionCounts.non_f1],
    ["Unknown city", quality.exclusiveDispositionCounts.unknown_location],
    ["Unknown status", quality.exclusiveDispositionCounts.unknown_status],
    ["Invalid date", quality.exclusiveDispositionCounts.invalid_date],
    ["Resolved missing end date", quality.exclusiveDispositionCounts.incomplete_record],
    ["Out-of-range date", quality.exclusiveDispositionCounts.out_of_range_date],
    ["Confirmed duplicate rows removed", duplicateRemoved],
    ["Schema-isolated rows", result.isolations.length],
    ["Other malformed records", quality.exclusiveDispositionCounts.other_exclusion],
  ]
    .map(([label, count]) => `- ${label}: ${count}`)
    .join("\n");
  return `# Checkmate Data Validation Report

Snapshot:
${manifest.snapshotDate}

Source:
Local manually supplied Checkee HTML

Network access:
None

Raw HTML files:

${result.fileReports.map((file) => `- data/raw/${file.fileName}`).join("\n")}

## Structure inspection

The eight supplied pages each contain one Check Reporter data table plus unrelated tables. The data table has one header row and no pagination residue, hidden duplicate table, or mobile/desktop duplicate. Repeated header rows: one per page. All pages use the following confirmed columns:

| HTML column | Normalized mapping |
| --- | --- |
${mapping.map(([field, target]) => `| ${field} | ${target} |`).join("\n")}

No \`UNKNOWN FIELD MAPPING\` remains for the supplied files. \`ID\` and \`Details\` are retained only in the ignored local normalized output and are not included in the public snapshot.

## Overall counts

- Raw HTML rows: ${result.rawRowCount}
- Parsed rows: ${result.cases.length}
- F-1 rows before dedupe: ${result.cases.filter((item) => item.visaType === "F1").length}
- Included public F-1 cases: ${snapshot.cases.length}
- Non-duplicate excluded rows: ${nonDuplicateExcluded}
- Confirmed duplicate rows removed by stable source ID: ${duplicateRemoved}
- Exact identical duplicate rows among those: ${result.exactDuplicateCount}
- Suspected duplicate groups retained: ${unresolvedDuplicateGroups}
- Future result rows reconstructed as Pending at cutoff: ${futureResultCount}
- Pending: ${manifest.statusCounts.pending}
- Resolved: ${manifest.statusCounts.clear + manifest.statusCounts.reject}
- Approved (Clear): ${manifest.statusCounts.clear}
- Refused (Reject): ${manifest.statusCounts.reject}
- Other / unknown excluded: ${quality.exclusiveDispositionCounts.unknown_status}
- Invalid / malformed excluded: ${quality.exclusiveDispositionCounts.invalid_date + quality.exclusiveDispositionCounts.incomplete_record + quality.exclusiveDispositionCounts.other_exclusion}

Accounting: ${result.rawRowCount} = ${snapshot.cases.length} included + ${nonDuplicateExcluded} non-duplicate excluded + ${duplicateRemoved} duplicate rows removed + ${result.isolations.length} schema-isolated rows.

${accounted === result.rawRowCount ? "No UNACCOUNTED RECORDS." : `UNACCOUNTED RECORDS: ${result.rawRowCount - accounted}`}

## Exclusion reasons

${excludedReasons}

## City validation

${cityValidationLines(snapshot, deduped)}
## Input file hashes

| File | Rows | SHA-256 |
| --- | ---: | --- |
${files}

## Snapshot and output

- Snapshot cutoff: \`${manifest.snapshotDate}\`
- Pending effective end date: \`${manifest.snapshotDate}\`
- Resolved effective end date: original valid \`Complete Date\` on or before cutoff
- Duration function: \`calculateDurationDays(startDate, effectiveEndDate)\` using calendar days; same day is 0
- Public output: \`public/data/checkee-static-snapshot.json\`
- Local traceable normalized output: \`data/normalized/public-f1-checks.json\`
- Local metadata: \`data/normalized/public-f1-checks.meta.json\`
- Inspection output: \`data/generated/checkee-static-ingest-report.json\`

## Privacy and product boundary

- The frontend imports only the public snapshot; it never imports raw HTML or local normalized provenance.
- Public cases are real local Checkee snapshot records and are no longer marked \`DEMO DATA\`.
- Peer Sample remains 100 mock records and Hall of Fame remains 10 curated mock records; both retain \`DEMO DATA\`.
- \`STATIC SNAPSHOT\` remains because this is not realtime data.
- The dataset is descriptive public-sample evidence, not official processing time, probability, prediction, or an individual outcome.
`;
}

async function writeStage3EOutputs(
  result: Awaited<ReturnType<typeof load>>,
  snapshot: PublicSnapshot,
) {
  const normalizedCases = buildNormalizedPublicCases(result.cases, DATA_SNAPSHOT.cutoffDate);
  await writeJson(NORMALIZED_OUTPUT, normalizedCases);
  await writeJson(NORMALIZED_META_OUTPUT, {
    snapshotDate: DATA_SNAPSHOT.cutoffDate,
    source: "Checkee local HTML snapshot",
    generatedAt: IMPORTED_AT,
    rawRecordCount: result.rawRowCount,
    parsedRecordCount: result.cases.length,
    includedRecordCount: normalizedCases.length,
    isMock: false,
    sourceFiles: result.fileReports.map((file) => file.fileName),
  });
  await writeFile(VALIDATION_REPORT_OUTPUT, buildValidationReport(result, snapshot), "utf8");
}

function printImportSummary(result: Awaited<ReturnType<typeof load>>, snapshot: PublicSnapshot) {
  const deduped = dedupeBySourceKey(result.cases);
  const excludedCount =
    result.rawRowCount -
    snapshot.cases.length -
    (result.cases.length - deduped.length) -
    result.isolations.length;
  const citySummary = LOCATIONS.map((location) => {
    const metrics = snapshot.locations[location];
    return `${location}: n=${metrics.sampleCount} Q1=${displayNumber(metrics.waitStats.q1)} Median=${displayNumber(metrics.waitStats.median)} Q3=${displayNumber(metrics.waitStats.q3)}`;
  });
  console.log(
    [
      "Checkmate Snapshot Build",
      `Snapshot: ${DATA_SNAPSHOT.cutoffDate}`,
      "",
      `Raw records: ${result.rawRowCount}`,
      `Parsed: ${result.cases.length}`,
      `F-1 before dedupe: ${result.cases.filter((item) => item.visaType === "F1").length}`,
      `Included: ${snapshot.cases.length}`,
      `Excluded (non-duplicate): ${excludedCount}`,
      `Duplicates removed: ${result.cases.length - deduped.length}`,
      "",
      ...citySummary,
      "",
      `Validation report: ${VALIDATION_REPORT_OUTPUT}`,
      `Output: ${NORMALIZED_OUTPUT}`,
    ].join("\n"),
  );
}

function safeInspection(result: Awaited<ReturnType<typeof load>>) {
  return {
    generatedAt: IMPORTED_AT,
    inputMode: "manual-html-static",
    rawRowCount: result.rawRowCount,
    parsedRowCount: result.cases.length,
    isolatedRowCount: result.isolations.length,
    exactDuplicateCount: result.exactDuplicateCount,
    possibleDuplicateCount: result.possibleDuplicateCount,
    duplicateKeyGroupCount: result.duplicateKeyGroupCount,
    duplicateGroups: result.duplicateGroups,
    sampleAudit: sampleAudit(result),
    isolationsByReason: Object.fromEntries(
      Object.entries(
        result.isolations.reduce<Record<string, number>>((counts, item) => {
          counts[item.reason] = (counts[item.reason] ?? 0) + 1;
          return counts;
        }, {}),
      ).sort(([left], [right]) => left.localeCompare(right)),
    ),
    files: result.fileReports,
  };
}

export async function main(mode: string) {
  if (mode === "validate") {
    const snapshot = JSON.parse(
      await readFile(path.resolve("public/data/checkee-static-snapshot.json"), "utf8"),
    ) as PublicSnapshot;
    if (snapshot.manifest.sourceMode !== "manual-html-static" || snapshot.manifest.isLive) {
      throw new Error("Static snapshot validation failed: source mode or live flag is unsafe.");
    }
    console.log(
      JSON.stringify({
        mode: snapshot.manifest.sourceMode,
        recordCount: snapshot.manifest.recordCount,
        checksum: snapshot.manifest.snapshotChecksum,
        isLive: snapshot.manifest.isLive,
      }),
    );
    return;
  }

  const result = await load();
  const inspection = safeInspection(result);
  await writeJson("data/generated/checkee-static-ingest-report.json", inspection);
  if (mode === "inspect") {
    console.log(JSON.stringify(inspection, null, 2));
    return;
  }

  const snapshot = buildSnapshot(result);
  await writeJson("public/data/checkee-static-snapshot.json", snapshot);
  await writeJson("public/data/checkee-static-manifest.json", snapshot.manifest);
  await writeStage3EOutputs(result, snapshot);
  printImportSummary(result, snapshot);
}
