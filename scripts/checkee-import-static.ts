import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { ManualCheckeeHtmlAdapter } from "../lib/data/manual-html-adapter";
import { buildPublicSnapshot } from "../lib/data/public-snapshot";
import { normalizeLocation, normalizeVisaEntry, normalizeVisaType } from "../lib/data/allowlists";
import type { PublicSnapshot } from "../lib/data/models";

const IMPORTED_AT = "2026-08-23T00:00:00Z";
const SOURCE_MONTHS = Array.from(
  { length: 8 },
  (_, index) => `2026-${String(index + 1).padStart(2, "0")}`,
);

function inputPaths() {
  const inputDir = path.resolve(process.env.CHECKEE_HTML_DIR ?? "dataset_260823");
  return SOURCE_MONTHS.map((month) =>
    path.join(inputDir, `${month.slice(2).replace("-", "")}.html`),
  );
}

function options() {
  return {
    importedAt: process.env.CHECKEE_IMPORT_AT ?? IMPORTED_AT,
    snapshotDate: "2026-08-31",
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
      ["Waiting Day(s)", "waitingDaysReported → pendingAgeDays", "yes", "primary"],
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
  console.log(JSON.stringify(inspection, null, 2));
  if (mode === "inspect") return;

  const snapshot = buildSnapshot(result);
  await writeJson("public/data/checkee-static-snapshot.json", snapshot);
  await writeJson("public/data/checkee-static-manifest.json", snapshot.manifest);
  console.log(
    JSON.stringify({
      rawRowCount: result.rawRowCount,
      parsedRowCount: result.cases.length,
      isolatedRowCount: result.isolations.length,
      publicRowCount: snapshot.cases.length,
      exactDuplicateCount: result.exactDuplicateCount,
      possibleDuplicateCount: result.possibleDuplicateCount,
      checksum: snapshot.manifest.snapshotChecksum,
    }),
  );
}
