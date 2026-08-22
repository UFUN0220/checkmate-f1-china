import {
  normalizeLocation,
  normalizeMajorCategory,
  normalizeStatus,
  normalizeVisaEntry,
  normalizeVisaType,
} from "./allowlists";
import type { DataOrigin, DataQualityFlag, ExclusionReason, NormalizedCase } from "./models";

export interface RawCaseInput {
  sourceRecordKeyInternal: string;
  publicId: string;
  visaTypeRaw: string;
  visaEntryRaw?: string | null;
  consulateRaw: string;
  majorRaw?: string | null;
  sourceStatusRaw: string;
  checkDate?: string | null;
  completeDate?: string | null;
  waitingDaysReported?: number | null;
  sourceMonth: string;
}

export interface NormalizeContext {
  origin: DataOrigin;
  fetchedAt: string;
  snapshotDate: string;
  rangeStart: string;
}

function parseIsoDate(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

export function differenceInDays(start: string, end: string) {
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  return Math.round((endTime - startTime) / 86_400_000);
}

function addFlag(flags: DataQualityFlag[], flag: DataQualityFlag) {
  if (!flags.includes(flag)) flags.push(flag);
}

export function normalizeRawCase(raw: RawCaseInput, context: NormalizeContext): NormalizedCase {
  const dataQualityFlags: DataQualityFlag[] = [];
  const visaType = normalizeVisaType(raw.visaTypeRaw);
  const location = normalizeLocation(raw.consulateRaw);
  const status = normalizeStatus(raw.sourceStatusRaw);
  const visaEntry = normalizeVisaEntry(raw.visaEntryRaw);
  const checkDate = parseIsoDate(raw.checkDate);
  const completeDate = parseIsoDate(raw.completeDate);

  if (!visaType) addFlag(dataQualityFlags, "unknown_visa_type");
  if (!location) addFlag(dataQualityFlags, "unknown_location");
  if (status === "unknown") addFlag(dataQualityFlags, "unknown_status");
  if (raw.checkDate && !checkDate) addFlag(dataQualityFlags, "invalid_check_date");
  if (raw.completeDate && !completeDate) addFlag(dataQualityFlags, "invalid_complete_date");
  if (checkDate && checkDate > context.snapshotDate) addFlag(dataQualityFlags, "future_check_date");
  if (checkDate && completeDate && completeDate < checkDate) {
    addFlag(dataQualityFlags, "invalid_date_order");
  }
  if (checkDate && raw.sourceMonth && !checkDate.startsWith(raw.sourceMonth)) {
    addFlag(dataQualityFlags, "source_month_mismatch");
  }

  const expectedDays =
    checkDate && status === "pending"
      ? differenceInDays(checkDate, context.snapshotDate)
      : checkDate && status === "clear" && completeDate
        ? differenceInDays(checkDate, completeDate)
        : null;
  if (
    expectedDays !== null &&
    raw.waitingDaysReported !== null &&
    raw.waitingDaysReported !== undefined
  ) {
    if (expectedDays !== raw.waitingDaysReported)
      addFlag(dataQualityFlags, "waiting_days_mismatch");
  }

  let exclusionReason: ExclusionReason | null = null;
  if (!visaType) exclusionReason = "non_f1";
  else if (!location) exclusionReason = "unknown_location";
  else if (status === "unknown") exclusionReason = "unknown_status";
  else if (!checkDate || (raw.checkDate && !checkDate) || (raw.completeDate && !completeDate)) {
    exclusionReason = "invalid_date";
  } else if (checkDate < context.rangeStart || checkDate > context.snapshotDate) {
    exclusionReason = "out_of_range_date";
  } else if (dataQualityFlags.includes("invalid_date_order")) {
    exclusionReason = "invalid_date";
  }

  return {
    sourceRecordKeyInternal: raw.sourceRecordKeyInternal,
    publicId: raw.publicId,
    visaTypeRaw: raw.visaTypeRaw,
    visaType,
    visaEntryRaw: raw.visaEntryRaw ?? null,
    visaEntry,
    consulateRaw: raw.consulateRaw,
    location,
    majorRaw: raw.majorRaw ?? null,
    majorCategory: normalizeMajorCategory(raw.majorRaw),
    sourceStatusRaw: raw.sourceStatusRaw,
    status,
    checkDate,
    completeDate,
    waitingDaysReported: raw.waitingDaysReported ?? null,
    sourceMonth: raw.sourceMonth,
    fetchedAt: context.fetchedAt,
    snapshotDate: context.snapshotDate,
    dataQualityFlags,
    exclusionReason,
    eligible: exclusionReason === null,
    origin: context.origin,
  };
}
