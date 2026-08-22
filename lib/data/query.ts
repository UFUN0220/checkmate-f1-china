import type { CaseStatus, Location, PublicCase, VisaEntry } from "./models";

export interface CaseFilters {
  locations: Location[];
  statuses: Exclude<CaseStatus, "unknown">[];
  months: string[];
  degrees: string[];
  majorGroups: string[];
  entries: VisaEntry[];
}

export const EMPTY_CASE_FILTERS: CaseFilters = {
  locations: [],
  statuses: [],
  months: [],
  degrees: [],
  majorGroups: [],
  entries: [],
};

function matchesAny<T>(value: T, selected: T[]) {
  return selected.length === 0 || selected.includes(value);
}

export function filterPublicCases(cases: PublicCase[], filters: CaseFilters) {
  return cases.filter(
    (item) =>
      matchesAny(item.location, filters.locations) &&
      matchesAny(item.status, filters.statuses) &&
      matchesAny(item.checkDate.slice(0, 7), filters.months) &&
      matchesAny(item.degree, filters.degrees) &&
      matchesAny(item.majorGroup, filters.majorGroups) &&
      matchesAny(item.visaEntry, filters.entries),
  );
}

function readList(params: URLSearchParams, key: string) {
  return [
    ...new Set(
      (params.get(key) ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

function writeList(params: URLSearchParams, key: string, values: string[]) {
  if (values.length) params.set(key, [...new Set(values)].sort().join(","));
}

export function filtersToSearchParams(filters: CaseFilters) {
  const params = new URLSearchParams();
  writeList(params, "location", filters.locations);
  writeList(params, "status", filters.statuses);
  writeList(params, "month", filters.months);
  writeList(params, "degree", filters.degrees);
  writeList(params, "majorGroup", filters.majorGroups);
  writeList(params, "entry", filters.entries);
  return params;
}

export function filtersFromSearchParams(params: URLSearchParams): CaseFilters {
  return {
    locations: readList(params, "location") as Location[],
    statuses: readList(params, "status") as CaseFilters["statuses"],
    months: readList(params, "month"),
    degrees: readList(params, "degree"),
    majorGroups: readList(params, "majorGroup").concat(readList(params, "major")),
    entries: readList(params, "entry") as VisaEntry[],
  };
}

export function filtersEqual(left: CaseFilters, right: CaseFilters) {
  return (
    JSON.stringify(filtersToSearchParams(left).toString()) ===
    JSON.stringify(filtersToSearchParams(right).toString())
  );
}
