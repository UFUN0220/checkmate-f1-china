import type {
  Page2Case,
  Page2Metrics,
  Page2QualityReport,
  Page2Snapshot,
  Page2Status,
} from "./models";
import { calculateWaitStats } from "../analytics/metrics";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

export interface Page2SourceRow {
  startDate: unknown;
  endDate: unknown;
  status: unknown;
  mergedValues: unknown[];
  degree: unknown;
  major: unknown;
  hasFormula?: boolean;
  isBlank?: boolean;
}

function validIsoDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateFromParts(year: number, month: number, day: number) {
  const value = `${year}-${pad(month)}-${pad(day)}`;
  return validIsoDate(value) ? value : null;
}

export function normalizeExcelDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return dateFromParts(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(EXCEL_EPOCH + Math.round(value) * MS_PER_DAY);
    return Number.isNaN(date.getTime())
      ? null
      : dateFromParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  const isoParts = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoParts) return dateFromParts(Number(isoParts[1]), Number(isoParts[2]), Number(isoParts[3]));
  const localizedParts = text.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (localizedParts) {
    return dateFromParts(
      Number(localizedParts[3]),
      Number(localizedParts[1]),
      Number(localizedParts[2]),
    );
  }
  return null;
}

export function calculatePage2WaitingDays(startDate: string, effectiveEndDate: string) {
  if (!validIsoDate(startDate) || !validIsoDate(effectiveEndDate)) {
    throw new Error("Page2 waiting days require valid YYYY-MM-DD dates");
  }
  const days =
    (Date.parse(`${effectiveEndDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) /
    MS_PER_DAY;
  if (days < 0) throw new Error("Page2 end date cannot precede start date");
  return days;
}

export function mergePage2Info(values: unknown[]) {
  const parts = values
    .map((value) =>
      typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim(),
    )
    .filter(Boolean);
  return parts.length ? parts.join("; ") : null;
}

function statusOf(value: unknown): Page2Status | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "approve" || normalized === "approved") return "approved";
  if (normalized === "check" || normalized === "pending") return "pending";
  return null;
}

function textOf(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function hash(value: string) {
  let result = 0x811c9dc5;
  for (const character of value) {
    result ^= character.codePointAt(0) ?? 0;
    result = Math.imul(result, 0x01000193);
  }
  return (result >>> 0).toString(16).padStart(8, "0");
}

function rounded(value: number) {
  return Math.round(value * 10) / 10;
}

export function calculatePage2Metrics(cases: Page2Case[]): Page2Metrics {
  const waitingDaysTotal = cases.reduce((sum, item) => sum + item.waitingDays, 0);
  return {
    totalCases: cases.length,
    approvedCases: cases.filter((item) => item.status === "approved").length,
    pendingOrOtherCases: cases.filter((item) => item.status !== "approved").length,
    waitingDaysTotal,
    waitingDaysSampleSize: cases.length,
    averageWaitingDays: cases.length ? rounded(waitingDaysTotal / cases.length) : null,
    waitingStats: calculateWaitStats(cases),
  };
}

export function normalizePage2Rows(rows: Page2SourceRow[], snapshotDate: string): Page2Snapshot {
  const cases: Page2Case[] = [];
  let blankRows = 0;
  let formulaRows = 0;
  let missingStartDateRows = 0;
  let invalidStartDateRows = 0;
  let invalidEndDateRows = 0;
  let endBeforeStartRows = 0;
  let unknownStatusRows = 0;
  let missingEndDateRows = 0;
  let mergedInfoRows = 0;
  let privacySuppressedInfoRows = 0;
  const dateValues: string[] = [];
  const statusCounts = new Map<string, number>();

  for (const [rowIndex, row] of rows.entries()) {
    if (row.hasFormula) formulaRows += 1;
    if (row.isBlank) {
      blankRows += 1;
      continue;
    }
    const startDate = normalizeExcelDate(row.startDate);
    const endDate = normalizeExcelDate(row.endDate);
    const rawStart = row.startDate !== null && row.startDate !== undefined && row.startDate !== "";
    const rawEnd = row.endDate !== null && row.endDate !== undefined && row.endDate !== "";
    if (!rawStart) missingStartDateRows += 1;
    else if (!startDate) invalidStartDateRows += 1;
    if (rawEnd && !endDate) invalidEndDateRows += 1;
    if (!rawEnd) missingEndDateRows += 1;
    const status = statusOf(row.status);
    const statusText =
      typeof row.status === "string" ? row.status.trim() : String(row.status ?? "");
    statusCounts.set(statusText, (statusCounts.get(statusText) ?? 0) + 1);
    if (!status) unknownStatusRows += 1;
    const mergedInfo = mergePage2Info(row.mergedValues);
    if (mergedInfo) {
      mergedInfoRows += 1;
      privacySuppressedInfoRows += 1;
    }
    if (!startDate || (rawEnd && !endDate) || !status) continue;
    const effectiveEndDate = endDate ?? snapshotDate;
    let waitingDays: number;
    try {
      waitingDays = calculatePage2WaitingDays(startDate, effectiveEndDate);
    } catch {
      endBeforeStartRows += 1;
      continue;
    }
    dateValues.push(startDate);
    cases.push({
      id: `page2-${hash(`${rowIndex}|${startDate}|${status}|${row.degree ?? ""}|${row.major ?? ""}|${waitingDays}`)}`,
      startDate,
      endDate,
      effectiveEndDate,
      waitingDays,
      status,
      degree: textOf(row.degree),
      major: textOf(row.major),
      mergedInfo: null,
    });
  }

  cases.sort(
    (left, right) =>
      left.startDate.localeCompare(right.startDate) || left.id.localeCompare(right.id),
  );
  const metrics = calculatePage2Metrics(cases);
  const invalidRows = rows.length - blankRows - cases.length;
  const qualityReport: Page2QualityReport = {
    rawRows: rows.length,
    parsedRows: rows.length - blankRows,
    includedRows: cases.length,
    invalidRows,
    blankRows,
    formulaRows,
    missingStartDateRows,
    invalidStartDateRows,
    invalidEndDateRows,
    endBeforeStartRows,
    unknownStatusRows,
    missingEndDateRows,
    mergedInfoRows,
    privacySuppressedInfoRows,
    dateMin: dateValues.length ? [...dateValues].sort()[0] : null,
    dateMax: dateValues.length ? [...dateValues].sort().at(-1)! : null,
    approveSourceColumn: "F · 状态",
    approveSourceValuesAccepted: ["Approve", "Approved"],
    statusNormalization: {
      Approve: "approved",
      Approved: "approved",
      Check: "pending",
      Pending: "pending",
    },
    columnMapping: {
      E: "面签日期 → startDate",
      F: "状态 → status",
      G: "结束日期 → endDate/effectiveEndDate",
      H: "学校（原始字段，仅合并审计，不公开）",
      I: "备注（原始字段，仅合并审计，不公开）",
      J: "无表头备注（mapping ambiguity；仅合并审计，不公开）",
    },
  };
  return {
    sourceName: "page2.xlsx",
    snapshotDate,
    sourceMode: "page2-xlsx-static",
    isMock: false,
    metadata: qualityReport,
    metrics,
    cases,
  };
}
