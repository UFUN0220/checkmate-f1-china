import { DEMO_RAW_CASES } from "./demo-fixture";
import { normalizeRawCase, type NormalizeContext } from "./normalize";
import { buildPublicSnapshot } from "./public-snapshot";
import { DATA_SNAPSHOT } from "./snapshot-config";

const DEMO_CONTEXT: NormalizeContext = {
  origin: "DEMO_DATA",
  fetchedAt: "2026-08-31T00:00:00Z",
  snapshotDate: DATA_SNAPSHOT.cutoffDate,
  rangeStart: "2026-01-01",
};

const normalizedCases = DEMO_RAW_CASES.map((raw) => normalizeRawCase(raw, DEMO_CONTEXT));

export const DEMO_SNAPSHOT = buildPublicSnapshot(normalizedCases, {
  sourceName: "DEMO_DATA",
  sourceUrl: "offline://demo-fixture",
  sourceMode: "demo-fixture",
  dataOrigin: "DEMO_DATA",
  accessStatus: "DEMO_DATA",
  rangeStart: "2026-01-01",
  rangeEnd: "2026-08",
  coverageFrom: "2026-01",
  coverageThrough: "2026-08",
  sourceMonths: [
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
  ],
  importedAt: DEMO_CONTEXT.fetchedAt,
  fetchedAt: DEMO_CONTEXT.fetchedAt,
  snapshotDate: DEMO_CONTEXT.snapshotDate,
  parserVersion: "demo-fixture-v1",
  rawPageCount: 0,
  currentMonthPartial: true,
  demoData: true,
  schemaVersion: "3a-demo-v1",
  isLive: false,
});
