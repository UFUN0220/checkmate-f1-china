import {
  calculateCohorts,
  calculateLocationMetrics,
  calculateMetrics,
  calculateMonthlyF1Trends,
  reconcileCounts,
} from "../analytics/metrics";
import { calculateDurationDays } from "./normalize";
import type { ExclusiveDisposition, NormalizedCase, PublicCase, PublicSnapshot } from "./models";

export interface SnapshotBuildOptions {
  sourceName: string;
  sourceUrl: string;
  sourceMode: "manual-html-static" | "demo-fixture" | "checkee-export";
  dataOrigin: NormalizedCase["origin"];
  accessStatus: PublicSnapshot["manifest"]["accessStatus"];
  rangeStart: string;
  rangeEnd: string;
  coverageFrom: string;
  coverageThrough: string;
  sourceMonths: string[];
  importedAt: string;
  fetchedAt: string;
  snapshotDate: string;
  parserVersion: string;
  rawPageCount: number;
  currentMonthPartial: boolean;
  demoData: boolean;
  schemaVersion: string;
  isLive: boolean;
  quarantinedCount?: number;
  exactDuplicateCount?: number;
  possibleDuplicateCount?: number;
}

function simpleHash(value: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function toPublicCase(
  item: NormalizedCase,
  snapshotDate: string,
  publicId: string,
): PublicCase | null {
  if (
    !item.eligible ||
    item.visaType !== "F1" ||
    !item.location ||
    item.status === "unknown" ||
    !item.checkDate
  ) {
    return null;
  }
  const futureResult = item.completeDate !== null && item.completeDate > snapshotDate;
  const snapshotStatus = item.status === "pending" || futureResult ? "pending" : item.status;
  const pendingAgeSource = snapshotStatus === "pending" ? "derived_snapshot_date" : null;
  const effectiveEndDate = snapshotStatus === "pending" ? snapshotDate : item.completeDate;
  const durationDays = effectiveEndDate
    ? calculateDurationDays(item.checkDate, effectiveEndDate)
    : null;
  const pendingAgeDays = snapshotStatus === "pending" ? durationDays : null;
  const resolvedDurationDays =
    snapshotStatus === "clear" && item.completeDate
      ? calculateDurationDays(item.checkDate, item.completeDate)
      : null;
  if (durationDays !== null && durationDays < 0) return null;
  return {
    publicId,
    visaType: "F1",
    visaEntry: item.visaEntry,
    degree: item.degree,
    majorGroup: item.majorGroup,
    location: item.location,
    majorCategory: item.majorCategory,
    status: snapshotStatus,
    checkDate: item.checkDate,
    completeDate: futureResult ? null : item.completeDate,
    effectiveEndDate,
    durationDays,
    durationSource: effectiveEndDate
      ? snapshotStatus === "pending"
        ? "cutoff_date"
        : "result_date"
      : null,
    pendingAgeDays,
    pendingAgeSource,
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

const EMPTY_DISPOSITION_COUNTS: Record<ExclusiveDisposition, number> = {
  included: 0,
  non_f1: 0,
  out_of_range_date: 0,
  unknown_location: 0,
  unknown_status: 0,
  invalid_date: 0,
  incomplete_record: 0,
  duplicate: 0,
  other_exclusion: 0,
};

function exclusiveDisposition(item: NormalizedCase): ExclusiveDisposition {
  if (item.exclusionReason === "non_f1") return "non_f1";
  if (item.exclusionReason === "out_of_range_date") return "out_of_range_date";
  if (item.exclusionReason === "unknown_location") return "unknown_location";
  if (item.exclusionReason === "unknown_status") return "unknown_status";
  if (item.exclusionReason === "invalid_date") return "invalid_date";
  if (item.exclusionReason === "incomplete_record") return "incomplete_record";
  return "other_exclusion";
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
  const exclusiveDispositionCounts = { ...EMPTY_DISPOSITION_COUNTS };
  const publicCandidates: NormalizedCase[] = [];
  for (const item of normalizedCases) {
    if (emittedKeys.has(item.sourceRecordKeyInternal)) {
      exclusiveDispositionCounts.duplicate += 1;
      continue;
    }
    emittedKeys.add(item.sourceRecordKeyInternal);
    if (!item.eligible) {
      exclusiveDispositionCounts[exclusiveDisposition(item)] += 1;
      continue;
    }
    const candidate = toPublicCase(item, options.snapshotDate, "");
    if (!candidate) {
      exclusiveDispositionCounts.invalid_date += 1;
      continue;
    }
    exclusiveDispositionCounts.included += 1;
    publicCandidates.push(item);
  }
  const cases = publicCandidates
    .map((item, index) =>
      toPublicCase(item, options.snapshotDate, `case-${String(index + 1).padStart(4, "0")}`),
    )
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
      sourceUrl: options.sourceUrl,
      sourceMode: options.sourceMode,
      dataOrigin: options.dataOrigin,
      accessStatus: options.accessStatus,
      rangeStart: options.rangeStart,
      rangeEnd: options.rangeEnd,
      coverageFrom: options.coverageFrom,
      coverageThrough: options.coverageThrough,
      sourceMonths: options.sourceMonths,
      importedAt: options.importedAt,
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
      recordCount: cases.length,
      consulateCounts: locationCounts,
      excludedCount: normalizedCases.length - cases.length,
      quarantinedCount: options.quarantinedCount ?? 0,
      schemaVersion: options.schemaVersion,
      snapshotChecksum: simpleHash(serializedCases),
      isLive: options.isLive,
    },
    national,
    locations,
    cohorts: calculateCohorts(cases, options.rangeStart.slice(0, 7), options.rangeEnd),
    monthlyF1Trends: calculateMonthlyF1Trends(
      publicCandidates,
      options.snapshotDate,
      options.rangeStart.slice(0, 7),
      options.rangeEnd,
    ),
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
      duplicateCandidateCount: exclusiveDispositionCounts.duplicate,
      duplicateKeyGroupCount: duplicateKeys.size,
      duplicateRemovalCount: exclusiveDispositionCounts.duplicate,
      exactDuplicateCount: options.exactDuplicateCount ?? duplicateKeys.size,
      possibleDuplicateCount: options.possibleDuplicateCount ?? 0,
      exclusiveDispositionCounts,
      quarantinedCount: options.quarantinedCount ?? 0,
      schemaGuardPassed: true,
      sensitiveFieldHits,
    },
  };
}
