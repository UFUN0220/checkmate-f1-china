export const LOCATIONS = ["beijing", "shanghai", "guangzhou", "shenyang", "wuhan"] as const;
export type Location = (typeof LOCATIONS)[number];

export const VISA_ENTRIES = ["initial", "renewal", "unknown"] as const;
export type VisaEntry = (typeof VISA_ENTRIES)[number];

export const CASE_STATUSES = ["pending", "clear", "reject", "unknown"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export type DataOrigin = "DEMO_DATA" | "CHECKEE_EXPORT" | "CHECKEE_HTML";

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
  | "duplicate_candidate"
  | "schema_guard_failed";

export type ExclusionReason =
  | "non_f1"
  | "unknown_location"
  | "unknown_status"
  | "out_of_range_date"
  | "invalid_date"
  | "duplicate_candidate"
  | "schema_guard_failed";

export interface NormalizedCase {
  sourceRecordKeyInternal: string;
  publicId: string;
  visaTypeRaw: string;
  visaType: "F1" | null;
  visaEntryRaw: string | null;
  visaEntry: VisaEntry;
  consulateRaw: string;
  location: Location | null;
  majorRaw: string | null;
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
  location: Location;
  majorCategory: string;
  status: Exclude<CaseStatus, "unknown">;
  checkDate: string;
  completeDate: string | null;
  pendingAgeDays: number | null;
  resolvedDurationDays: number | null;
  sourceMonth: string;
  snapshotDate: string;
  dataOrigin: DataOrigin;
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
  visaEntryDistribution: DistributionItem[];
}

export interface CohortMetrics extends AggregateMetrics {
  month: string;
  partial: boolean;
}

export interface DatasetManifest {
  sourceName: string;
  dataOrigin: DataOrigin;
  accessStatus: "DEMO_DATA" | "CHECKEE_ACCESS_BLOCKED" | "CHECKEE_ACCESS_ENABLED";
  rangeStart: string;
  rangeEnd: string;
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
