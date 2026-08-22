import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ManualCheckeeHtmlAdapter } from "../lib/data/manual-html-adapter";
import { buildPublicSnapshot } from "../lib/data/public-snapshot";
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
