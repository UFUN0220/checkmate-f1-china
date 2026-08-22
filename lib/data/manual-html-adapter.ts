import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";
import { normalizeRawCase, type RawCaseInput } from "./normalize";
import type { NormalizedCase } from "./models";
import type { CaseSourceAdapter } from "./adapters";

const DATASET_FILE_PATTERN = /^26(0[1-8])\.html$/i;
const REQUIRED_HEADERS = [
  "update",
  "id",
  "visa type",
  "visa entry",
  "us consulate",
  "major",
  "status",
  "check date",
  "complete date",
  "waiting day(s)",
  "details",
] as const;

const HEADER_ALIASES: Record<string, string[]> = {
  update: ["update"],
  id: ["id", "case id", "record id"],
  "visa type": ["visa type", "visatype"],
  "visa entry": ["visa entry", "visaentry", "entry"],
  "us consulate": ["us consulate", "consulate", "location"],
  major: ["major", "major group"],
  status: ["status", "visa status"],
  "check date": ["check date", "checkdate"],
  "complete date": ["complete date", "completedate"],
  "waiting day(s)": ["waiting day(s)", "waiting days", "waiting days(s)", "waiting"],
  details: ["details", "detail"],
};

export interface HtmlFileParseReport {
  fileName: string;
  sourceMonth: string;
  sizeBytes: number;
  sha256: string;
  encoding: string;
  title: string;
  tableCount: number;
  dataTableRowCount: number;
  headers: string[];
  pagination: {
    hasNext: boolean;
    hasPrevious: boolean;
    hasPageToken: boolean;
  };
  emptyState: boolean;
  repeatedHeaderCount: number;
  hasMobileDesktopDuplicate: boolean;
  sensitiveColumns: string[];
  parsedRowCount: number;
  isolatedRowCount: number;
}

export interface HtmlIsolationReport {
  fileName: string;
  rowNumber: number;
  reason:
    "wrong_cell_count" | "missing_source_id" | "invalid_waiting_days" | "missing_required_value";
}

export interface ManualHtmlLoadResult {
  cases: NormalizedCase[];
  fileReports: HtmlFileParseReport[];
  isolations: HtmlIsolationReport[];
  rawRowCount: number;
  exactDuplicateCount: number;
  possibleDuplicateCount: number;
}

export interface ManualHtmlAdapterOptions {
  importedAt: string;
  snapshotDate: string;
  rangeStart: string;
  waitingDaysReferenceDate?: string | null;
}

export class ManualHtmlSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManualHtmlSchemaError";
  }
}

function normalizeHeader(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanCell(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceMonthForFile(fileName: string) {
  const match = DATASET_FILE_PATTERN.exec(fileName);
  if (!match) throw new ManualHtmlSchemaError(`Unsupported manual HTML filename: ${fileName}`);
  return `2026-${match[1]}`;
}

function detectEncoding(html: string) {
  const match = html.match(/charset\s*=\s*["']?([^"'\s>]+)/i);
  return match?.[1]?.toLowerCase() ?? "utf-8-assumed";
}

function textOf(document: Document) {
  return cleanCell(document.body?.textContent ?? "");
}

function findHeaderTable(document: Document) {
  const tables = [...document.querySelectorAll("table")];
  const candidates = tables.filter((table) => {
    const firstRow = table.querySelector("tr");
    const headers = firstRow
      ? [...firstRow.children].map((cell) => normalizeHeader(cell.textContent))
      : [];
    return headers.includes("visa type") && headers.includes("check date");
  });
  if (candidates.length !== 1) {
    throw new ManualHtmlSchemaError(
      `Expected exactly one Checkee data table, found ${candidates.length}.`,
    );
  }
  return { table: candidates[0], tableCount: tables.length };
}

function resolveHeaderIndexes(headers: string[]) {
  const indexes = new Map<string, number>();
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    const matches = headers.flatMap((header, index) => (aliases.includes(header) ? [index] : []));
    if (matches.length !== 1) {
      throw new ManualHtmlSchemaError(
        `Header ${canonical} must resolve to exactly one column; found ${matches.length}.`,
      );
    }
    indexes.set(canonical, matches[0]);
  }
  const known = new Set(Object.values(HEADER_ALIASES).flat());
  const unknown = headers.filter((header) => !known.has(header));
  if (unknown.length) {
    throw new ManualHtmlSchemaError(`Unknown Checkee data columns: ${unknown.join(", ")}.`);
  }
  return indexes;
}

function parseWaitingDays(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function makeRawCase(
  cells: Element[],
  indexes: Map<string, number>,
  fileName: string,
  sourceMonth: string,
  rowNumber: number,
) {
  const value = (key: string) => cleanCell(cells[indexes.get(key) ?? -1]?.textContent ?? "");
  const sourceId = value("id");
  const waitingDays = parseWaitingDays(value("waiting day(s)"));
  if (!sourceId) return { isolation: "missing_source_id" as const };
  if (waitingDays === null) return { isolation: "invalid_waiting_days" as const };
  const raw: RawCaseInput = {
    sourceRecordKeyInternal: `checkee-id:${sourceId}`,
    publicId: `html-${fileName}-${rowNumber}`,
    sourceFileName: fileName,
    visaTypeRaw: value("visa type"),
    visaEntryRaw: value("visa entry"),
    consulateRaw: value("us consulate"),
    majorRaw: value("major") || null,
    sourceStatusRaw: value("status"),
    checkDate: value("check date") || null,
    completeDate: value("complete date") || null,
    waitingDaysReported: waitingDays,
    sourceMonth,
  };
  if (!raw.visaTypeRaw || !raw.consulateRaw || !raw.sourceStatusRaw || !raw.checkDate) {
    return { isolation: "missing_required_value" as const };
  }
  return { raw };
}

function fingerprint(item: NormalizedCase) {
  return JSON.stringify([
    item.visaType,
    item.visaEntry,
    item.location,
    item.majorRaw,
    item.status,
    item.checkDate,
    item.completeDate,
    item.waitingDaysReported,
  ]);
}

export class ManualCheckeeHtmlAdapter implements CaseSourceAdapter {
  readonly name = "ManualCheckeeHtmlAdapter";
  private readonly filePaths: readonly string[];
  private readonly options: ManualHtmlAdapterOptions;

  constructor(filePaths: readonly string[], options: ManualHtmlAdapterOptions) {
    if (!filePaths.length)
      throw new ManualHtmlSchemaError("At least one local HTML path is required.");
    if (filePaths.some((filePath) => /^(?:https?:|file:|ftp:)/i.test(filePath))) {
      throw new ManualHtmlSchemaError("Manual HTML adapter accepts local file paths only.");
    }
    this.filePaths = filePaths;
    this.options = options;
  }

  async load() {
    return (await this.loadDetailed()).cases;
  }

  async loadDetailed(): Promise<ManualHtmlLoadResult> {
    const cases: NormalizedCase[] = [];
    const fileReports: HtmlFileParseReport[] = [];
    const isolations: HtmlIsolationReport[] = [];

    for (const filePath of this.filePaths) {
      const fileName = path.basename(filePath);
      const sourceMonth = sourceMonthForFile(fileName);
      const [buffer, fileInfo] = await Promise.all([readFile(filePath), stat(filePath)]);
      const html = buffer.toString("utf8");
      const document = new JSDOM(html).window.document;
      const { table, tableCount } = findHeaderTable(document);
      const rows = [...table.querySelectorAll("tr")];
      const headers = [...rows[0].children].map((cell) => normalizeHeader(cell.textContent));
      const indexes = resolveHeaderIndexes(headers);
      const expectedMonth = textOf(document).match(/Tracker\s*\((2026-\d{2})\)/i)?.[1];
      if (expectedMonth !== sourceMonth) {
        throw new ManualHtmlSchemaError(
          `${fileName} filename month ${sourceMonth} disagrees with page month ${expectedMonth ?? "missing"}.`,
        );
      }
      const repeatedHeaderRows = rows.slice(1).filter((row) => {
        const text = cleanCell(row.textContent ?? "");
        return /Visa Type/i.test(text) && /Check Date/i.test(text);
      });
      const dataRows = rows.slice(1).filter((row) => !repeatedHeaderRows.includes(row));
      let parsedRowCount = 0;
      let isolatedRowCount = 0;
      for (const [offset, row] of dataRows.entries()) {
        const rowNumber = offset + 2;
        const cells = [...row.children];
        if (cells.length !== REQUIRED_HEADERS.length) {
          isolations.push({ fileName, rowNumber, reason: "wrong_cell_count" });
          isolatedRowCount += 1;
          continue;
        }
        const result = makeRawCase(cells, indexes, fileName, sourceMonth, rowNumber);
        if ("isolation" in result && result.isolation) {
          isolations.push({ fileName, rowNumber, reason: result.isolation });
          isolatedRowCount += 1;
          continue;
        }
        cases.push(
          normalizeRawCase(result.raw, {
            origin: "CHECKEE_HTML",
            fetchedAt: this.options.importedAt,
            snapshotDate: this.options.snapshotDate,
            rangeStart: this.options.rangeStart,
            waitingDaysReferenceDate: this.options.waitingDaysReferenceDate ?? null,
          }),
        );
        parsedRowCount += 1;
      }
      const bodyText = textOf(document);
      fileReports.push({
        fileName,
        sourceMonth,
        sizeBytes: fileInfo.size,
        sha256: createHash("sha256").update(buffer).digest("hex"),
        encoding: detectEncoding(html),
        title: document.title,
        tableCount,
        dataTableRowCount: dataRows.length,
        headers: [...rows[0].children].map((cell) => cleanCell(cell.textContent ?? "")),
        pagination: {
          hasNext: /\bnext\b/i.test(bodyText),
          hasPrevious: /\b(?:previous|prev)\b/i.test(bodyText),
          hasPageToken: /\bpage\b/i.test(bodyText),
        },
        emptyState: /no records|no data|暂无|没有记录|empty/i.test(bodyText),
        repeatedHeaderCount: repeatedHeaderRows.length + 1,
        hasMobileDesktopDuplicate:
          [...document.querySelectorAll("table")].filter((candidate) => {
            const firstRow = candidate.querySelector("tr");
            return firstRow && /Visa Type/i.test(firstRow.textContent ?? "");
          }).length > 1,
        sensitiveColumns: headers.filter((header) =>
          /\bid\b|details?|comments?|user/i.test(header),
        ),
        parsedRowCount,
        isolatedRowCount,
      });
    }

    const seen = new Map<string, NormalizedCase>();
    let exactDuplicateCount = 0;
    for (const item of cases) {
      const previous = seen.get(item.sourceRecordKeyInternal);
      if (previous) {
        if (fingerprint(previous) === fingerprint(item)) exactDuplicateCount += 1;
      } else {
        seen.set(item.sourceRecordKeyInternal, item);
      }
    }
    const fingerprints = new Map<string, number>();
    for (const item of cases)
      fingerprints.set(fingerprint(item), (fingerprints.get(fingerprint(item)) ?? 0) + 1);
    const possibleDuplicateCount = [...fingerprints.values()].filter((count) => count > 1).length;
    return {
      cases,
      fileReports,
      isolations,
      rawRowCount: fileReports.reduce((sum, report) => sum + report.dataTableRowCount, 0),
      exactDuplicateCount,
      possibleDuplicateCount,
    };
  }
}
