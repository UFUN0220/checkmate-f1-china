import hallInput from "../../data/manual/hall-of-fame.json";
import peerInput from "../../data/manual/peer-sample.json";
import { calculateDurationDays } from "./normalize";
import { MOCK_HALL_OF_FAME, MOCK_PEER_CASES } from "./mock-snapshot";
import { DATA_SNAPSHOT } from "./snapshot-config";
import type {
  DatasetMetadata,
  HallOfFameInput,
  ManualCheckCase,
  MockCheckCase,
  PeerCaseInput,
} from "./models";

export interface ManualValidation {
  valid: boolean;
  errors: string[];
}

export interface ManualDataset<T> {
  metadata: DatasetMetadata;
  cases: T[];
  validation: ManualValidation;
}

export class ManualDatasetValidationError extends Error {
  constructor(
    public readonly dataset: "peer" | "hall-of-fame",
    errors: string[],
  ) {
    super(`${dataset} manual dataset validation failed: ${errors.join("; ")}`);
    this.name = "ManualDatasetValidationError";
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UNSAFE_NOTE_PATTERN =
  /(?:@|email|phone|passport|sevis|ds-?160|wechat|qq|student\s*id|姓名|学号|护照|电话|邮箱|微信)/i;

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addError(errors: string[], message: string) {
  errors.push(message);
}

type SharedInput = {
  id?: unknown;
  startDate?: unknown;
  status?: unknown;
  endDate?: unknown;
  note?: unknown;
};

function validateShared(
  records: SharedInput[],
  dataset: "peer" | "hall-of-fame",
  snapshotDate: string,
) {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const [index, record] of records.entries()) {
    const row = index + 1;
    if (!record || typeof record !== "object") {
      addError(errors, `row ${row}: record must be an object`);
      continue;
    }
    if (typeof record.id !== "string" || !record.id.trim()) {
      addError(errors, `row ${row}: id is required`);
    } else if (ids.has(record.id)) {
      addError(errors, `row ${row}: duplicate id ${record.id}`);
    } else {
      ids.add(record.id);
    }
    if (!validDate(record.startDate)) addError(errors, `row ${row}: invalid startDate`);
    if (!(["pending", "clear", "reject"] as unknown[]).includes(record.status)) {
      addError(errors, `row ${row}: invalid status`);
    }
    if (record.status === "pending" && record.endDate !== undefined) {
      addError(errors, `row ${row}: pending must not have endDate`);
    }
    if (record.status !== "pending" && !validDate(record.endDate)) {
      addError(errors, `row ${row}: resolved status requires valid endDate`);
    }
    if (record.endDate !== undefined && !validDate(record.endDate)) {
      addError(errors, `row ${row}: invalid endDate`);
    }
    if (validDate(record.startDate) && validDate(record.endDate)) {
      if (record.endDate < record.startDate)
        addError(errors, `row ${row}: endDate before startDate`);
      if (record.endDate > snapshotDate && record.status === "pending") {
        addError(errors, `row ${row}: pending future endDate must be omitted`);
      }
    }
    if (dataset === "peer" && record.note !== undefined && typeof record.note !== "string") {
      addError(errors, `row ${row}: note must be a string`);
    }
    if (
      dataset === "peer" &&
      typeof record.note === "string" &&
      UNSAFE_NOTE_PATTERN.test(record.note)
    ) {
      addError(errors, `row ${row}: note contains a prohibited personal identifier`);
    }
  }
  return errors;
}

export function validatePeerDataset(
  records: PeerCaseInput[],
  snapshotDate: string = DATA_SNAPSHOT.cutoffDate,
) {
  const errors = validateShared(records, "peer", snapshotDate);
  return { valid: errors.length === 0, errors } satisfies ManualValidation;
}

export function validateHallOfFameDataset(
  records: HallOfFameInput[],
  snapshotDate: string = DATA_SNAPSHOT.cutoffDate,
) {
  const errors = validateShared(records, "hall-of-fame", snapshotDate);
  for (const [index, record] of records.entries()) {
    if (record.displayName !== undefined && typeof record.displayName !== "string")
      addError(errors, `row ${index + 1}: displayName must be a string`);
    if (record.subtitle !== undefined && typeof record.subtitle !== "string")
      addError(errors, `row ${index + 1}: subtitle must be a string`);
    if (typeof record.displayName === "string" && UNSAFE_NOTE_PATTERN.test(record.displayName))
      addError(errors, `row ${index + 1}: displayName contains a prohibited personal identifier`);
    if (typeof record.subtitle === "string" && UNSAFE_NOTE_PATTERN.test(record.subtitle))
      addError(errors, `row ${index + 1}: subtitle contains a prohibited personal identifier`);
  }
  return { valid: errors.length === 0, errors } satisfies ManualValidation;
}

function toCase(
  record: PeerCaseInput | HallOfFameInput,
  source: "peer" | "hall-of-fame",
  snapshotDate: string,
): ManualCheckCase {
  const futureEnd = record.endDate !== undefined && record.endDate > snapshotDate;
  const status = futureEnd ? "pending" : record.status;
  const endDate = futureEnd ? null : (record.endDate ?? null);
  const effectiveEndDate = status === "pending" ? snapshotDate : endDate;
  if (!effectiveEndDate) throw new Error(`Manual ${source} record ${record.id} has no end date`);
  const extras = {
    ...(source === "peer" && "note" in record && record.note ? { note: record.note } : {}),
    ...(source === "hall-of-fame" && "displayName" in record && record.displayName
      ? { displayName: record.displayName }
      : {}),
    ...(source === "hall-of-fame" && "subtitle" in record && record.subtitle
      ? { subtitle: record.subtitle }
      : {}),
  };
  return {
    id: record.id,
    source,
    city: null,
    visaType: "F1",
    startDate: record.startDate,
    endDate,
    effectiveEndDate,
    status,
    rawStatus: status[0].toUpperCase() + status.slice(1),
    durationDays: calculateDurationDays(record.startDate, effectiveEndDate),
    isMock: false,
    ...extras,
  };
}

function buildManual<T extends PeerCaseInput | HallOfFameInput>(
  records: T[],
  source: "peer" | "hall-of-fame",
  snapshotDate: string,
): ManualDataset<ManualCheckCase> {
  const validation =
    source === "peer"
      ? validatePeerDataset(records as PeerCaseInput[], snapshotDate)
      : validateHallOfFameDataset(records as HallOfFameInput[], snapshotDate);
  if (!validation.valid) throw new ManualDatasetValidationError(source, validation.errors);
  const cases = records.map((record) => toCase(record, source, snapshotDate));
  return {
    metadata: { source, isMock: false, snapshotDate, sampleSize: cases.length },
    cases,
    validation,
  };
}

function mockDataset(cases: MockCheckCase[], source: "peer" | "hall-of-fame") {
  return {
    metadata: {
      source,
      isMock: true,
      snapshotDate: DATA_SNAPSHOT.cutoffDate,
      sampleSize: cases.length,
    },
    cases,
    validation: { valid: true, errors: [] },
  } satisfies ManualDataset<MockCheckCase>;
}

export function loadPeerDataset(
  records = peerInput as PeerCaseInput[],
  snapshotDate: string = DATA_SNAPSHOT.cutoffDate,
): ManualDataset<ManualCheckCase | MockCheckCase> {
  return records.length
    ? buildManual(records, "peer", snapshotDate)
    : mockDataset(MOCK_PEER_CASES, "peer");
}

export function loadHallOfFameDataset(
  records = hallInput as HallOfFameInput[],
  snapshotDate: string = DATA_SNAPSHOT.cutoffDate,
): ManualDataset<ManualCheckCase | MockCheckCase> {
  return records.length
    ? buildManual(records, "hall-of-fame", snapshotDate)
    : mockDataset(MOCK_HALL_OF_FAME, "hall-of-fame");
}
