import { DEMO_RAW_CASES } from "./demo-fixture";
import { normalizeRawCase, type NormalizeContext } from "./normalize";
import { buildPublicSnapshot } from "./public-snapshot";

const DEMO_CONTEXT: NormalizeContext = {
  origin: "DEMO_DATA",
  fetchedAt: "2026-08-22T00:00:00Z",
  snapshotDate: "2026-08-22",
  rangeStart: "2026-01-01",
};

const normalizedCases = DEMO_RAW_CASES.map((raw) => normalizeRawCase(raw, DEMO_CONTEXT));

export const DEMO_SNAPSHOT = buildPublicSnapshot(normalizedCases, {
  sourceName: "DEMO_DATA",
  dataOrigin: "DEMO_DATA",
  accessStatus: "DEMO_DATA",
  rangeStart: "2026-01-01",
  rangeEnd: "2026-08",
  fetchedAt: DEMO_CONTEXT.fetchedAt,
  snapshotDate: DEMO_CONTEXT.snapshotDate,
  parserVersion: "demo-fixture-v1",
  rawPageCount: 0,
  currentMonthPartial: true,
  demoData: true,
});
