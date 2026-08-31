import { DEMO_RAW_CASES } from "./demo-fixture";
import { normalizeRawCase, type NormalizeContext, type RawCaseInput } from "./normalize";
import type { NormalizedCase } from "./models";
import { DATA_SNAPSHOT } from "./snapshot-config";

export type CheckeeAccessMode = "disabled" | "enabled";

export function getCheckeeAccessMode(value = process.env.CHECKEE_ACCESS_MODE): CheckeeAccessMode {
  return value === "enabled" ? "enabled" : "disabled";
}

export class CheckeeAccessDisabledError extends Error {
  constructor() {
    super(
      "CHECKEE_ACCESS_MODE=disabled; real Checkee access is blocked until explicit authorization.",
    );
    this.name = "CheckeeAccessDisabledError";
  }
}

export interface CaseSourceAdapter {
  readonly name: string;
  load(): Promise<NormalizedCase[]>;
}

const DEMO_CONTEXT: NormalizeContext = {
  origin: "DEMO_DATA",
  fetchedAt: "2026-08-31T00:00:00Z",
  snapshotDate: DATA_SNAPSHOT.cutoffDate,
  rangeStart: "2026-01-01",
};

export class DemoFixtureAdapter implements CaseSourceAdapter {
  readonly name = "DemoFixtureAdapter";

  async load() {
    return DEMO_RAW_CASES.map((raw) => normalizeRawCase(raw, DEMO_CONTEXT));
  }
}

type ExportRow = Record<string, unknown>;

function stringValue(row: ExportRow, keys: string[]) {
  const key = keys.find((candidate) => row[candidate] !== undefined);
  return key ? String(row[key] ?? "").trim() : "";
}

function nullableStringValue(row: ExportRow, keys: string[]) {
  const value = stringValue(row, keys);
  return value || null;
}

function numberValue(row: ExportRow, keys: string[]) {
  const value = stringValue(row, keys);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapExportRow(row: ExportRow, index: number): RawCaseInput {
  const sourceRecordKeyInternal = stringValue(row, ["sourceRecordKeyInternal", "source_key", "id"]);
  const visaTypeRaw = stringValue(row, ["visaTypeRaw", "visa_type", "visaType"]);
  const consulateRaw = stringValue(row, ["consulateRaw", "location", "consulate"]);
  const sourceStatusRaw = stringValue(row, ["sourceStatusRaw", "status"]);
  if (!sourceRecordKeyInternal || !visaTypeRaw || !consulateRaw || !sourceStatusRaw) {
    throw new Error(`Checkee export schema guard failed at row ${index + 1}.`);
  }

  return {
    sourceRecordKeyInternal,
    publicId: `export-${index + 1}`,
    visaTypeRaw,
    visaEntryRaw: nullableStringValue(row, ["visaEntryRaw", "visa_entry", "visaEntry"]),
    consulateRaw,
    majorRaw: nullableStringValue(row, ["majorRaw", "major"]),
    sourceStatusRaw,
    checkDate: nullableStringValue(row, ["checkDate", "check_date"]),
    completeDate: nullableStringValue(row, ["completeDate", "complete_date"]),
    waitingDaysReported: numberValue(row, ["waitingDaysReported", "waiting_days"]),
    sourceMonth: stringValue(row, ["sourceMonth", "source_month"]),
  };
}

function parseCsv(csv: string): ExportRow[] {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2)
    throw new Error(
      "Checkee export schema guard failed: CSV requires a header and at least one row.",
    );
  const parseLine = (line: string) => {
    const values: string[] = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        values.push(value.trim());
        value = "";
      } else {
        value += char;
      }
    }
    values.push(value.trim());
    return values;
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

export class CheckeeExportAdapter implements CaseSourceAdapter {
  readonly name = "CheckeeExportAdapter";
  private readonly payload: string | readonly ExportRow[];
  private readonly context: NormalizeContext;

  constructor(payload: string | readonly ExportRow[], context: NormalizeContext) {
    this.payload = payload;
    this.context = context;
  }

  async load() {
    const rows =
      typeof this.payload === "string"
        ? this.payload.trim().startsWith("[")
          ? (JSON.parse(this.payload) as ExportRow[])
          : parseCsv(this.payload)
        : [...this.payload];
    return rows.map(mapExportRow).map((raw) => normalizeRawCase(raw, this.context));
  }
}

export class CheckeeHtmlAdapter implements CaseSourceAdapter {
  readonly name = "CheckeeHtmlAdapter";
  private readonly accessMode: CheckeeAccessMode;

  constructor(accessMode = getCheckeeAccessMode()) {
    this.accessMode = accessMode;
  }

  async load(): Promise<NormalizedCase[]> {
    if (this.accessMode !== "enabled") throw new CheckeeAccessDisabledError();
    throw new Error(
      "CheckeeHtmlAdapter is intentionally not implemented until explicit source authorization.",
    );
  }
}
