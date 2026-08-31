export const DATA_SNAPSHOT = {
  cutoffDate: "2026-08-31",
  label: "截至 2026 年 8 月 31 日",
  shortLabel: "截至 2026-08-31",
  coverageLabel: "2026-01 至 2026-08",
} as const;

export type SnapshotConfig = typeof DATA_SNAPSHOT;
