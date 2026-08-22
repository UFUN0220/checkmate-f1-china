import {
  calculateCohorts,
  calculateLocationMetrics,
  calculateMetrics,
  reconcileCounts,
} from "../analytics/metrics";
import type { NormalizedCase, PublicCase, PublicSnapshot } from "./models";

export interface SnapshotBuildOptions {
  sourceName: string;
  dataOrigin: NormalizedCase["origin"];
  accessStatus: PublicSnapshot["manifest"]["accessStatus"];
  rangeStart: string;
  rangeEnd: string;
  fetchedAt: string;
  snapshotDate: string;
  parserVersion: string;
  rawPageCount: number;
  currentMonthPartial: boolean;
  demoData: boolean;
}

function dateDifference(start: string, end: string) {
  return Math.round(
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000,
  );
}

function simpleHash(value: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function toPublicCase(item: NormalizedCase, snapshotDate: string): PublicCase | null {
  if (
    !item.eligible ||
    item.visaType !== "F1" ||
    !item.location ||
    item.status === "unknown" ||
    !item.checkDate
  ) {
    return null;
  }
  const pendingAgeDays =
    item.status === "pending" ? dateDifference(item.checkDate, snapshotDate) : null;
  const resolvedDurationDays =
    item.status === "clear" && item.completeDate
      ? dateDifference(item.checkDate, item.completeDate)
      : null;
  if (pendingAgeDays !== null && pendingAgeDays < 0) return null;
  if (resolvedDurationDays !== null && resolvedDurationDays < 0) return null;
  return {
    publicId: item.publicId,
    visaType: "F1",
    visaEntry: item.visaEntry,
    location: item.location,
    majorCategory: item.majorCategory,
    status: item.status,
    checkDate: item.checkDate,
    completeDate: item.completeDate,
    pendingAgeDays,
    resolvedDurationDays,
    sourceMonth: item.sourceMonth,
    snapshotDate,
    dataOrigin: item.origin,
  };
}

function countFlags(cases: NormalizedCase[]) {
  const counts: Record<string, number> = {};
  for (const item of cases) {
    for (const flag of item.dataQualityFlags) counts[flag] = (counts[flag] ?? 0) + 1;
  }
  return counts;
}

function countByReason(cases: NormalizedCase[]) {
  const counts: Record<string, number> = {};
  for (const item of cases) {
    if (item.exclusionReason)
      counts[item.exclusionReason] = (counts[item.exclusionReason] ?? 0) + 1;
  }
  return counts;
}

function containsSensitiveField(value: string) {
  return /(?:comments?|details?|password|email|phone|passport|ds-?160|sevis|case\s*(?:number|id)|wechat|qq)/i.test(
    value,
  );
}

export function buildPublicSnapshot(
  normalizedCases: NormalizedCase[],
  options: SnapshotBuildOptions,
): PublicSnapshot {
  const seenKeys = new Set<string>();
  const duplicateKeys = new Set<string>();
  for (const item of normalizedCases) {
    if (seenKeys.has(item.sourceRecordKeyInternal)) duplicateKeys.add(item.sourceRecordKeyInternal);
    seenKeys.add(item.sourceRecordKeyInternal);
  }

  const emittedKeys = new Set<string>();
  const cases = normalizedCases
    .filter((item) => {
      if (emittedKeys.has(item.sourceRecordKeyInternal)) return false;
      emittedKeys.add(item.sourceRecordKeyInternal);
      return true;
    })
    .map((item) => toPublicCase(item, options.snapshotDate))
    .filter((item): item is PublicCase => item !== null)
    .sort((left, right) => right.checkDate.localeCompare(left.checkDate));
  const excludedCountByReason = countByReason(normalizedCases);
  if (duplicateKeys.size) excludedCountByReason.duplicate_candidate = duplicateKeys.size;
  const national = calculateMetrics(cases, cases.length);
  const locations = calculateLocationMetrics(cases, cases.length);
  const reconciliation = reconcileCounts(cases, locations);
  if (!reconciliation.passed) throw new Error("Public snapshot reconciliation failed.");

  const serializedCases = JSON.stringify(cases);
  const statusCounts = {
    pending: national.pendingCount,
    clear: national.clearCount,
    reject: national.rejectCount,
  };
  const locationCounts = Object.fromEntries(
    Object.entries(locations).map(([location, metrics]) => [location, metrics.sampleCount]),
  ) as PublicSnapshot["manifest"]["locationCounts"];
  const sensitiveFieldHits = containsSensitiveField(serializedCases)
    ? ["public_case_sensitive_field_pattern"]
    : [];
  if (sensitiveFieldHits.length) throw new Error("Public snapshot sensitive field scan failed.");

  return {
    manifest: {
      sourceName: options.sourceName,
      dataOrigin: options.dataOrigin,
      accessStatus: options.accessStatus,
      rangeStart: options.rangeStart,
      rangeEnd: options.rangeEnd,
      fetchedAt: options.fetchedAt,
      snapshotDate: options.snapshotDate,
      parserVersion: options.parserVersion,
      rawPageCount: options.rawPageCount,
      includedCount: cases.length,
      excludedCountByReason,
      statusCounts,
      locationCounts,
      contentHash: simpleHash(serializedCases),
      currentMonthPartial: options.currentMonthPartial,
      demoData: options.demoData,
    },
    national,
    locations,
    cohorts: calculateCohorts(cases, options.rangeStart.slice(0, 7), options.rangeEnd),
    cases,
    qualityReport: {
      totalCandidates: normalizedCases.length,
      includedCount: cases.length,
      excludedCount: normalizedCases.length - cases.length,
      excludedCountByReason,
      flagCounts: countFlags(normalizedCases),
      waitingDayMismatchCount: normalizedCases.filter((item) =>
        item.dataQualityFlags.includes("waiting_days_mismatch"),
      ).length,
      monthConflictCount: normalizedCases.filter((item) =>
        item.dataQualityFlags.includes("source_month_mismatch"),
      ).length,
      duplicateCandidateCount: duplicateKeys.size,
      schemaGuardPassed: true,
      sensitiveFieldHits,
    },
  };
}
