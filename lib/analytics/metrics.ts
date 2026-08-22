import type {
  AggregateMetrics,
  CohortMetrics,
  DistributionItem,
  Location,
  PublicCase,
} from "../data/models";
import { LOCATIONS } from "../data/models";

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function percentile(values: number[], percentileValue: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * percentileValue;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function distribution(values: string[], denominator: number): DistributionItem[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => ({
      key,
      count,
      share: denominator ? round(count / denominator, 4) : 0,
    }));
}

export function calculateMetrics(
  cases: PublicCase[],
  totalForShare = cases.length,
): AggregateMetrics {
  const pending = cases.filter((item) => item.status === "pending");
  const clear = cases.filter((item) => item.status === "clear");
  const reject = cases.filter((item) => item.status === "reject");
  const pendingAges = pending.flatMap((item) =>
    item.pendingAgeDays === null ? [] : [item.pendingAgeDays],
  );
  const resolvedDurations = clear.flatMap((item) =>
    item.resolvedDurationDays === null ? [] : [item.resolvedDurationDays],
  );
  const dates = cases.map((item) => item.checkDate).sort();

  return {
    sampleCount: cases.length,
    sampleShare: totalForShare ? round(cases.length / totalForShare, 4) : 0,
    sampleBand: cases.length < 5 ? "insufficient" : cases.length < 10 ? "small" : "standard",
    pendingCount: pending.length,
    clearCount: clear.length,
    rejectCount: reject.length,
    pendingAgeMeanDays: pendingAges.length
      ? round(pendingAges.reduce((sum, value) => sum + value, 0) / pendingAges.length)
      : null,
    pendingAgeMedianDays: median(pendingAges),
    pendingAgeP75Days: percentile(pendingAges, 0.75),
    pendingAgeMaxDays: pendingAges.length ? Math.max(...pendingAges) : null,
    resolvedSampleCount: resolvedDurations.length,
    resolvedDurationMedianDays: median(resolvedDurations),
    resolvedDurationP75Days: percentile(resolvedDurations, 0.75),
    checkDateRange: dates.length ? { start: dates[0], end: dates[dates.length - 1] } : null,
    majorDistribution: distribution(
      cases.map((item) => item.majorCategory),
      cases.length,
    ),
    degreeDistribution: distribution(
      cases.map((item) => item.degree),
      cases.length,
    ),
    majorGroupDistribution: distribution(
      cases.map((item) => item.majorGroup),
      cases.length,
    ),
    visaEntryDistribution: distribution(
      cases.map((item) => item.visaEntry),
      cases.length,
    ),
  };
}

function monthRange(start: string, end: string) {
  const months: string[] = [];
  const cursor = new Date(`${start}-01T00:00:00Z`);
  const limit = new Date(`${end}-01T00:00:00Z`);
  while (cursor <= limit) {
    months.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

export function calculateCohorts(
  cases: PublicCase[],
  rangeStartMonth: string,
  rangeEndMonth: string,
): CohortMetrics[] {
  const months = monthRange(rangeStartMonth, rangeEndMonth);
  return months.map((month) => ({
    month,
    partial: month === rangeEndMonth,
    ...calculateMetrics(
      cases.filter((item) => item.checkDate.startsWith(month)),
      cases.length,
    ),
  }));
}

export function calculateLocationMetrics(cases: PublicCase[], totalForShare = cases.length) {
  return Object.fromEntries(
    LOCATIONS.map((location) => [
      location,
      calculateMetrics(
        cases.filter((item) => item.location === location),
        totalForShare,
      ),
    ]),
  ) as Record<Location, AggregateMetrics>;
}

export function reconcileCounts(
  cases: PublicCase[],
  locationMetrics: Record<Location, AggregateMetrics>,
) {
  const locationTotal = LOCATIONS.reduce(
    (sum, location) => sum + locationMetrics[location].sampleCount,
    0,
  );
  const statusTotal = cases.reduce<Record<"pending" | "clear" | "reject", number>>(
    (counts, item) => ({ ...counts, [item.status]: counts[item.status] + 1 }),
    { pending: 0, clear: 0, reject: 0 },
  );
  return {
    passed:
      locationTotal === cases.length &&
      statusTotal.pending + statusTotal.clear + statusTotal.reject === cases.length,
    locationTotal,
    statusTotal,
  };
}
