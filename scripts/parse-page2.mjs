/* global console, process */

import { inflateRawSync } from "node:zlib";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SNAPSHOT_DATE = "2026-09-01";
const INPUT = path.resolve("data/raw/page2.xlsx");
const OUTPUT = path.resolve("public/data/page2-static-snapshot.json");
const REPORT_JSON = path.resolve("data/generated/page2-ingest-report.json");
const REPORT_MD = path.resolve("docs/data-validation-report-page2-2026-09-01.md");
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

function u16(buffer, offset) {
  return buffer.readUInt16LE(offset);
}
function u32(buffer, offset) {
  return buffer.readUInt32LE(offset);
}
function attrs(value) {
  const result = {};
  for (const match of value.matchAll(/([\w:]+)="([^"]*)"/g)) result[match[1]] = decodeXml(match[2]);
  return result;
}
function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
function textNodes(value) {
  return [...value.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
    .map((match) => decodeXml(match[1]))
    .join("");
}
function readZipEntries(buffer) {
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (u32(buffer, offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error("page2.xlsx is not a supported ZIP workbook");
  const count = u16(buffer, eocd + 10);
  const centralSize = u32(buffer, eocd + 12);
  let offset = u32(buffer, eocd + 16);
  const end = offset + centralSize;
  const entries = new Map();
  while (offset < end && entries.size < count) {
    if (u32(buffer, offset) !== 0x02014b50)
      throw new Error("page2.xlsx has a malformed central directory");
    const nameLength = u16(buffer, offset + 28);
    const extraLength = u16(buffer, offset + 30);
    const commentLength = u16(buffer, offset + 32);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    entries.set(name, {
      compression: u16(buffer, offset + 10),
      compressedSize: u32(buffer, offset + 20),
      localOffset: u32(buffer, offset + 42),
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
function unzip(buffer, name, entries) {
  const entry = entries.get(name);
  if (!entry) throw new Error(`page2.xlsx is missing ${name}`);
  const local = entry.localOffset;
  const nameLength = u16(buffer, local + 26);
  const extraLength = u16(buffer, local + 28);
  const compressed = buffer.subarray(
    local + 30 + nameLength + extraLength,
    local + 30 + nameLength + extraLength + entry.compressedSize,
  );
  if (entry.compression === 0) return compressed.toString("utf8");
  if (entry.compression === 8) return inflateRawSync(compressed).toString("utf8");
  throw new Error(`page2.xlsx uses unsupported compression ${entry.compression}`);
}
function worksheetPath(workbookXml, relsXml) {
  const sheet = workbookXml.match(/<sheet\b[^>]*r:id="([^"]+)"[^>]*>/);
  const relationship = [...relsXml.matchAll(/<Relationship\b([^>]*)\/?>(?:<\/Relationship>)?/g)]
    .map((match) => attrs(match[1]))
    .find((item) => item.Id === sheet?.[1]);
  if (!relationship?.Target) throw new Error("page2.xlsx worksheet relationship is missing");
  return relationship.Target.startsWith("/")
    ? relationship.Target.slice(1)
    : `xl/${relationship.Target.replace(/^\.\//, "")}`;
}
function sharedStrings(xml) {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) => textNodes(match[1]));
}
function readCell(xml, shared) {
  const cellAttrs = attrs(xml.match(/^<c\b([^>]*)>/)?.[1] ?? "");
  const value = xml.match(/<v>([\s\S]*?)<\/v>/)?.[1];
  const inline = xml.match(/<is>([\s\S]*?)<\/is>/)?.[1];
  if (cellAttrs.t === "inlineStr") return inline ? textNodes(inline) : null;
  if (value === undefined) return null;
  if (cellAttrs.t === "s") return shared[Number(value)] ?? null;
  if (cellAttrs.t === "b") return value === "1";
  const number = Number(value);
  return Number.isFinite(number) ? number : decodeXml(value);
}
function parseWorksheet(xml, shared) {
  const dimension = xml.match(/<dimension\b[^>]*ref="[A-Z]+\d+:[A-Z]+(\d+)"/);
  const maxRow = dimension ? Number(dimension[1]) : 1;
  const parsed = new Map();
  const formulaRows = new Set();
  for (const match of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowAttrs = attrs(match[1]);
    const rowNumber = Number(rowAttrs.r);
    const cells = {};
    for (const cell of match[2].matchAll(/<c\b(?![^>]*\/>)[^>]*>[\s\S]*?<\/c>|<c\b[^>]*\/>/g)) {
      const ref = attrs(cell[0].match(/^<c\b([^>]*)>/)?.[1] ?? "").r;
      const column = ref?.match(/^[A-Z]+/)?.[0];
      if (!column) continue;
      cells[column] = readCell(cell[0], shared);
      if (/<f(?:\s[^>]*)?>/.test(cell[0])) formulaRows.add(rowNumber);
    }
    parsed.set(rowNumber, cells);
  }
  const rows = [];
  for (let rowNumber = 2; rowNumber <= maxRow; rowNumber += 1) {
    const cells = parsed.get(rowNumber) ?? {};
    rows.push({
      startDate: cells.E,
      endDate: cells.G,
      status: cells.F,
      mergedValues: [cells.H, cells.I, cells.J],
      degree: cells.B,
      major: cells.C,
      hasFormula: formulaRows.has(rowNumber),
      isBlank: !Object.values(cells).some(
        (value) => value !== null && value !== undefined && value !== "",
      ),
    });
  }
  return { rows, maxRow, formulaRows };
}
function validIsoDate(value) {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function dateFromParts(year, month, day) {
  const value = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return validIsoDate(value) ? value : null;
}
function normalizeDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(EXCEL_EPOCH + Math.round(value) * MS_PER_DAY);
    return Number.isNaN(date.getTime())
      ? null
      : dateFromParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }
  if (typeof value !== "string") return null;
  const text = value.trim();
  const iso = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) return dateFromParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const localized = text.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  return localized
    ? dateFromParts(Number(localized[3]), Number(localized[1]), Number(localized[2]))
    : null;
}
function waitingDays(startDate, effectiveEndDate) {
  if (!validIsoDate(startDate) || !validIsoDate(effectiveEndDate)) throw new Error("invalid date");
  const days =
    (Date.parse(`${effectiveEndDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) /
    MS_PER_DAY;
  if (days < 0) throw new Error("end before start");
  return days;
}
function mergeInfo(values) {
  const parts = values.map((value) => (value == null ? "" : String(value).trim())).filter(Boolean);
  return parts.length ? parts.join("; ") : null;
}
function statusOf(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "approve" || normalized === "approved") return "approved";
  if (normalized === "check" || normalized === "pending") return "pending";
  return null;
}
function hash(value) {
  let result = 0x811c9dc5;
  for (const character of value) {
    result ^= character.codePointAt(0) ?? 0;
    result = Math.imul(result, 0x01000193);
  }
  return (result >>> 0).toString(16).padStart(8, "0");
}
function percentile(values, percentileValue) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * percentileValue;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}
function waitStats(cases) {
  const values = cases.map((item) => item.waitingDays).filter((value) => Number.isFinite(value));
  return {
    q1: percentile(values, 0.25),
    median: percentile(values, 0.5),
    q3: percentile(values, 0.75),
    sampleSize: values.length,
  };
}
function metrics(cases) {
  const total = cases.reduce((sum, item) => sum + item.waitingDays, 0);
  return {
    totalCases: cases.length,
    approvedCases: cases.filter((item) => item.status === "approved").length,
    pendingOrOtherCases: cases.filter((item) => item.status !== "approved").length,
    waitingDaysTotal: total,
    waitingDaysSampleSize: cases.length,
    averageWaitingDays: cases.length ? Math.round((total / cases.length) * 10) / 10 : null,
    waitingStats: waitStats(cases),
  };
}
function normalizeRows(rows) {
  const cases = [];
  let blankRows = 0,
    formulaRows = 0,
    missingStartDateRows = 0,
    invalidStartDateRows = 0,
    invalidEndDateRows = 0,
    endBeforeStartRows = 0,
    unknownStatusRows = 0,
    missingEndDateRows = 0,
    mergedInfoRows = 0,
    privacySuppressedInfoRows = 0;
  const dates = [];
  for (const [rowIndex, row] of rows.entries()) {
    if (row.hasFormula) formulaRows += 1;
    if (row.isBlank) {
      blankRows += 1;
      continue;
    }
    const startDate = normalizeDate(row.startDate);
    const endDate = normalizeDate(row.endDate);
    const rawStart = row.startDate !== null && row.startDate !== undefined && row.startDate !== "";
    const rawEnd = row.endDate !== null && row.endDate !== undefined && row.endDate !== "";
    if (!rawStart) missingStartDateRows += 1;
    else if (!startDate) invalidStartDateRows += 1;
    if (rawEnd && !endDate) invalidEndDateRows += 1;
    if (!rawEnd) missingEndDateRows += 1;
    const status = statusOf(row.status);
    if (!status) unknownStatusRows += 1;
    const merged = mergeInfo(row.mergedValues);
    if (merged) {
      mergedInfoRows += 1;
      privacySuppressedInfoRows += 1;
    }
    if (!startDate || (rawEnd && !endDate) || !status) continue;
    const effectiveEndDate = endDate ?? SNAPSHOT_DATE;
    let days;
    try {
      days = waitingDays(startDate, effectiveEndDate);
    } catch {
      endBeforeStartRows += 1;
      continue;
    }
    dates.push(startDate);
    cases.push({
      id: `page2-${hash(`${rowIndex}|${startDate}|${status}|${row.degree ?? ""}|${row.major ?? ""}|${days}`)}`,
      startDate,
      endDate,
      effectiveEndDate,
      waitingDays: days,
      status,
      degree: row.degree == null ? null : String(row.degree).trim() || null,
      major: row.major == null ? null : String(row.major).trim() || null,
      mergedInfo: null,
    });
  }
  cases.sort(
    (left, right) =>
      left.startDate.localeCompare(right.startDate) || left.id.localeCompare(right.id),
  );
  const resultMetrics = metrics(cases);
  const metadata = {
    rawRows: rows.length,
    parsedRows: rows.length - blankRows,
    includedRows: cases.length,
    invalidRows: rows.length - blankRows - cases.length,
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
    dateMin: dates.length ? [...dates].sort()[0] : null,
    dateMax: dates.length ? [...dates].sort().at(-1) : null,
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
    snapshotDate: SNAPSHOT_DATE,
    sourceMode: "page2-xlsx-static",
    isMock: false,
    metadata,
    metrics: resultMetrics,
    cases,
  };
}
function report(snapshot, sheetName) {
  const q = snapshot.metadata,
    m = snapshot.metrics;
  return `# Page2 数据校验报告（2026-09-01）

## XLSX inspection

- File: \`data/raw/page2.xlsx\`
- Sheet: \`${sheetName}\`
- Header row: 1
- Data rows inspected: ${q.rawRows}（不含表头，包含空行）
- E: 面签日期 → startDate
- F: 状态 → status（Approve/Approved → approved；Check/Pending → pending）
- G: 结束日期 → endDate；为空时使用固定快照日 \`2026-09-01\`
- H: 学校（可选，原始字段，仅合并审计，不公开）
- I: 备注（原始字段，仅合并审计，不公开）
- J: 无表头但存在备注文本，mapping ambiguity；仅合并审计，不公开
- Formula rows: ${q.formulaRows}

## Validation summary

| Metric | Count/value |
| --- | ---: |
| Raw rows | ${q.rawRows} |
| Parsed rows | ${q.parsedRows} |
| Included rows | ${q.includedRows} |
| Invalid rows | ${q.invalidRows} |
| Blank rows | ${q.blankRows} |
| Total cases | ${m.totalCases} |
| Approved | ${m.approvedCases} |
| Pending/Other | ${m.pendingOrOtherCases} |
| Missing G rows | ${q.missingEndDateRows} |
| Invalid E rows | ${q.invalidStartDateRows + q.missingStartDateRows} |
| Invalid G rows | ${q.invalidEndDateRows} |
| G < E rows | ${q.endBeforeStartRows} |
| Total waiting-day sum | ${m.waitingDaysTotal} |
| Valid waiting-day records | ${m.waitingDaysSampleSize} |
| Q1 waiting days | ${m.waitingStats.q1 ?? "—"} |
| Median waiting days | ${m.waitingStats.median ?? "—"} |
| Q3 waiting days | ${m.waitingStats.q3 ?? "—"} |
| Average waiting days | ${m.averageWaitingDays ?? "—"} |
| Date min | ${q.dateMin ?? "—"} |
| Date max | ${q.dateMax ?? "—"} |

UI primary waiting metric: Q1 / Median / Q3. Average waiting days is retained as a secondary audit metric only.

## Privacy boundary

H/I/J were merged with the required semicolon rule during normalization and audited as ${q.mergedInfoRows} non-empty source rows. They are suppressed from the public snapshot because H is a school field and I/J are unreviewed notes; this prevents school, comments/details and contact-like strings from entering the frontend bundle. Public cases retain only safe date, status, waiting-days, degree and major fields.
`;
}
function validate(snapshot) {
  const errors = [];
  if (snapshot.snapshotDate !== SNAPSHOT_DATE) errors.push("snapshotDate must be 2026-09-01");
  if (snapshot.isMock) errors.push("Page2 snapshot must not be mock");
  if (snapshot.sourceMode !== "page2-xlsx-static") errors.push("invalid sourceMode");
  if (JSON.stringify(metrics(snapshot.cases)) !== JSON.stringify(snapshot.metrics))
    errors.push("metrics do not reconcile");
  if (
    snapshot.cases.some(
      (item, index, cases) => index > 0 && cases[index - 1].startDate > item.startDate,
    )
  )
    errors.push("cases are not sorted ascending");
  if (snapshot.cases.some((item) => item.mergedInfo !== null))
    errors.push("unsafe mergedInfo entered public snapshot");
  if (snapshot.metadata.invalidRows !== 0) errors.push("invalid rows must be zero");
  if (errors.length) throw new Error(`Page2 snapshot validation failed: ${errors.join("; ")}`);
  return { valid: true, recordCount: snapshot.cases.length, snapshotDate: snapshot.snapshotDate };
}
async function main(mode = "inspect") {
  if (mode === "validate") {
    const snapshot = JSON.parse(await readFile(OUTPUT, "utf8"));
    console.log(JSON.stringify(validate(snapshot)));
    return;
  }
  const buffer = await readFile(INPUT);
  const entries = readZipEntries(buffer);
  const workbook = unzip(buffer, "xl/workbook.xml", entries);
  const rels = unzip(buffer, "xl/_rels/workbook.xml.rels", entries);
  const shared = entries.has("xl/sharedStrings.xml")
    ? sharedStrings(unzip(buffer, "xl/sharedStrings.xml", entries))
    : [];
  const sheetName = workbook.match(/<sheet\b[^>]*name="([^"]+)"/)?.[1] ?? "Sheet1";
  const parsed = parseWorksheet(unzip(buffer, worksheetPath(workbook, rels), entries), shared);
  if (mode === "inspect") {
    const inspected = normalizeRows(parsed.rows);
    console.log(
      JSON.stringify(
        {
          sheet: sheetName,
          rows: parsed.rows.length,
          quality: inspected.metadata,
          metrics: inspected.metrics,
        },
        null,
        2,
      ),
    );
    return;
  }
  const snapshot = normalizeRows(parsed.rows);
  validate(snapshot);
  await writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await writeFile(REPORT_JSON, `${JSON.stringify(snapshot.metadata, null, 2)}\n`, "utf8");
  await writeFile(REPORT_MD, report(snapshot, sheetName), "utf8");
  console.log(JSON.stringify({ ...snapshot.metrics, quality: snapshot.metadata }, null, 2));
}
await main(process.argv[2] ?? "inspect");
