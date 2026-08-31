export const DATA_SNAPSHOT = {
  cutoffDate: "2026-09-01",
  timestamp: "2026-09-01T00:00:00Z",
  displayTimestamp: "2026-09-01 00:00",
  label: "截至 2026-09-01 00:00",
  shortLabel: "截至 2026-09-01 00:00",
  coverageLabel: "2026-01 至 2026-08",
} as const;

export type SnapshotConfig = typeof DATA_SNAPSHOT;
