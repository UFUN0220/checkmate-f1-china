export type LocationKey = "guangzhou" | "beijing" | "shenyang" | "wuhan" | "shanghai";

export type LocationData = {
  key: LocationKey;
  name: string;
  count: number;
};

export const demoMeta = {
  sourceName: "Checkee.info",
  status: "blocked" as const,
  rangeStart: "2026-01-01",
  rangeEnd: "2026-08",
  lastSuccessfulSnapshot: null,
  total: null,
  pending: null,
  clear: null,
  reject: null,
} as const;

export const locationData: readonly LocationData[] = [];

export function getLocation(key: string | null) {
  return locationData.find((location) => location.key === key) ?? null;
}

export function getShare(count: number, total: number | null) {
  return total ? `${((count / total) * 100).toFixed(1)}%` : "—";
}

export function formatCount(value: number | null) {
  return value === null ? "—" : value;
}
