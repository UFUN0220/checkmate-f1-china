export const LOCATIONS = ["beijing", "shanghai", "guangzhou", "shenyang", "wuhan"] as const;
export type Location = (typeof LOCATIONS)[number];

export const VISA_ENTRIES = ["initial", "renewal", "unknown"] as const;
export type VisaEntry = (typeof VISA_ENTRIES)[number];

export const CASE_STATUSES = ["pending", "clear", "reject", "unknown"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export type DataOrigin = "DEMO_DATA" | "CHECKEE_EXPORT" | "CHECKEE_HTML";

export type MockCaseSource = "checkee" | "peer" | "hall-of-fame";

export type DataQualityFlag =
  | "unknown_visa_type"
  | "unknown_location"
  | "unknown_status"
  | "invalid_check_date"
  | "invalid_complete_date"
  | "future_check_date"
  | "invalid_date_order"
  | "source_month_mismatch"
  | "waiting_days_mismatch"
  | "missing_complete_date"
  | "duplicate_candidate"
  | "schema_guard_failed";

export type ExclusionReason =
  | "non_f1"
  | "unknown_location"
  | "unknown_status"
  | "out_of_range_date"
  | "invalid_date"
  | "incomplete_record"
  | "duplicate_candidate"
  | "schema_guard_failed";

export type ExclusiveDisposition =
  | "included"
  | "non_f1"
  | "out_of_range_date"
  | "unknown_location"
  | "unknown_status"
  | "invalid_date"
  | "incomplete_record"
  | "duplicate"
  | "other_exclusion";

export interface NormalizedCase {
  sourceRecordKeyInternal: string;
  publicId: string;
  sourceFileName: string | null;
  visaTypeRaw: string;
  visaType: "F1" | null;
  visaEntryRaw: string | null;
  visaEntry: VisaEntry;
  consulateRaw: string;
  location: Location | null;
  majorRaw: string | null;
  degree: string;
  majorGroup: string;
  majorCategory: string;
  sourceStatusRaw: string;
  status: CaseStatus;
  checkDate: string | null;
  completeDate: string | null;
  waitingDaysReported: number | null;
  sourceMonth: string;
  fetchedAt: string;
  snapshotDate: string;
  dataQualityFlags: DataQualityFlag[];
  exclusionReason: ExclusionReason | null;
  eligible: boolean;
  origin: DataOrigin;
}

export interface PublicCase {
  publicId: string;
  visaType: "F1";
  visaEntry: VisaEntry;
  degree: string;
  majorGroup: string;
  location: Location;
  majorCategory: string;
  status: Exclude<CaseStatus, "unknown">;
  checkDate: string;
  completeDate: string | null;
  effectiveEndDate: string | null;
  durationDays: number | null;
  durationSource: "cutoff_date" | "result_date" | null;
  pendingAgeDays: number | null;
  pendingAgeSource: "derived_snapshot_date" | null;
  resolvedDurationDays: number | null;
  sourceMonth: string;
  snapshotDate: string;
  dataOrigin: DataOrigin;
}

export interface MockCheckCase {
  id: string;
  source: MockCaseSource;
  city: Location | null;
  visaType: "F1";
  startDate: string;
  endDate: string | null;
  effectiveEndDate: string;
  status: Exclude<CaseStatus, "unknown">;
  rawStatus: string;
  durationDays: number;
  isMock: true;
}

export interface WaitStats {
  q1: number | null;
  median: number | null;
  q3: number | null;
  sampleSize: number;
}

export interface DistributionItem {
  key: string;
  count: number;
  share: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface AggregateMetrics {
  sampleCount: number;
  sampleShare: number;
  sampleBand: "insufficient" | "small" | "standard";
  pendingCount: number;
  clearCount: number;
  rejectCount: number;
  pendingAgeMeanDays: number | null;
  pendingAgeMedianDays: number | null;
  pendingAgeP75Days: number | null;
  pendingAgeMaxDays: number | null;
  resolvedSampleCount: number;
  resolvedDurationMedianDays: number | null;
  resolvedDurationP75Days: number | null;
  checkDateRange: DateRange | null;
  majorDistribution: DistributionItem[];
  degreeDistribution: DistributionItem[];
  majorGroupDistribution: DistributionItem[];
  visaEntryDistribution: DistributionItem[];
  waitStats: WaitStats;
}

export interface CohortMetrics extends AggregateMetrics {
  month: string;
  partial: boolean;
}

export interface DatasetManifest {
  sourceName: string;
  sourceUrl: string;
  sourceMode: "manual-html-static" | "demo-fixture" | "checkee-export";
  dataOrigin: DataOrigin;
  accessStatus: "DEMO_DATA" | "CHECKEE_ACCESS_BLOCKED" | "CHECKEE_ACCESS_ENABLED";
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
  includedCount: number;
  excludedCountByReason: Partial<Record<ExclusionReason | "access_blocked", number>>;
  statusCounts: Record<Exclude<CaseStatus, "unknown">, number>;
  locationCounts: Record<Location, number>;
  contentHash: string;
  currentMonthPartial: boolean;
  demoData: boolean;
  recordCount: number;
  consulateCounts: Record<Location, number>;
  excludedCount: number;
  quarantinedCount: number;
  schemaVersion: string;
  snapshotChecksum: string;
  isLive: boolean;
}

export interface DataQualityReport {
  totalCandidates: number;
  includedCount: number;
  excludedCount: number;
  excludedCountByReason: Partial<Record<ExclusionReason | "access_blocked", number>>;
  flagCounts: Partial<Record<DataQualityFlag, number>>;
  waitingDayMismatchCount: number;
  monthConflictCount: number;
  duplicateCandidateCount: number;
  duplicateKeyGroupCount: number;
  duplicateRemovalCount: number;
  exactDuplicateCount: number;
  possibleDuplicateCount: number;
  exclusiveDispositionCounts: Record<ExclusiveDisposition, number>;
  quarantinedCount: number;
  schemaGuardPassed: boolean;
  sensitiveFieldHits: string[];
}

export interface PublicSnapshot {
  manifest: DatasetManifest;
  national: AggregateMetrics;
  locations: Record<Location, AggregateMetrics>;
  cohorts: CohortMetrics[];
  cases: PublicCase[];
  qualityReport: DataQualityReport;
}
