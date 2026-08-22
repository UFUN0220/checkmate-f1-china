import type { CaseStatus, Location, VisaEntry } from "./models";

export const F1_ALIASES = new Set(["f1", "f-1", "f 1"]);

const LOCATION_ALIASES: Record<Location, string[]> = {
  beijing: ["beijing", "bei jing", "北京"],
  shanghai: ["shanghai", "上海"],
  guangzhou: ["guangzhou", "广州"],
  shenyang: ["shenyang", "沈阳"],
  wuhan: ["wuhan", "武汉"],
};

const VISA_ENTRY_ALIASES: Record<VisaEntry, string[]> = {
  initial: ["initial", "new", "首签", "首次"],
  renewal: ["renewal", "renew", "续签", "再签"],
  unknown: ["", "unknown", "n/a", "na", "null"],
};

const STATUS_ALIASES: Record<CaseStatus, string[]> = {
  pending: ["pending"],
  clear: ["clear"],
  reject: ["reject", "rejected"],
  unknown: ["", "unknown", "n/a", "na", "null"],
};

export function normalizeToken(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeVisaType(value: string | null | undefined) {
  const token = normalizeToken(value).replace(/_/g, "-");
  return F1_ALIASES.has(token) ? ("F1" as const) : null;
}

export function normalizeLocation(value: string | null | undefined): Location | null {
  const token = normalizeToken(value);
  for (const [location, aliases] of Object.entries(LOCATION_ALIASES) as [Location, string[]][]) {
    if (aliases.includes(token)) return location;
  }
  return null;
}

export function normalizeVisaEntry(value: string | null | undefined): VisaEntry {
  const token = normalizeToken(value);
  for (const [entry, aliases] of Object.entries(VISA_ENTRY_ALIASES) as [VisaEntry, string[]][]) {
    if (aliases.includes(token)) return entry;
  }
  return "unknown";
}

export function normalizeStatus(value: string | null | undefined): CaseStatus {
  const token = normalizeToken(value);
  for (const [status, aliases] of Object.entries(STATUS_ALIASES) as [CaseStatus, string[]][]) {
    if (aliases.includes(token)) return status;
  }
  return "unknown";
}

export function normalizeMajorCategory(value: string | null | undefined) {
  const token = normalizeToken(value);
  if (!token || ["unknown", "n/a", "na", "null"].includes(token)) return "Unknown";
  if (/computer|software|data|engineering|science|math/.test(token)) return "STEM";
  if (/business|finance|economics|management/.test(token)) return "Business";
  if (/social|education|law|humanities|art|design/.test(token))
    return "Humanities & Social Science";
  return "Other";
}

export function normalizeMajorGroup(value: string | null | undefined) {
  return normalizeMajorCategory(value);
}

export function normalizeDegree(value: string | null | undefined) {
  const token = normalizeToken(value);
  if (!token || ["unknown", "n/a", "na", "null"].includes(token)) return "Unknown";
  if (/phd|doctor|doctoral|postdoc/.test(token)) return "Doctoral";
  if (/master|mba|m\.s\.?|m\.a\.?|graduate/.test(token)) return "Master";
  if (/bachelor|undergrad|b\.s\.?|b\.a\.?/.test(token)) return "Bachelor";
  return "Unknown";
}
