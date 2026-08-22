import { describe, expect, it } from "vitest";
import { calculateLocationMetrics, calculateMetrics, reconcileCounts } from "../analytics/metrics";
import { CHECKEE_STATIC_SNAPSHOT } from "./static-snapshot";
import {
  EMPTY_CASE_FILTERS,
  filterPublicCases,
  filtersEqual,
  filtersFromSearchParams,
  filtersToSearchParams,
  type CaseFilters,
} from "./query";

const cases = CHECKEE_STATIC_SNAPSHOT.cases;

describe("public case query semantics", () => {
  it("applies a single condition", () => {
    const filtered = filterPublicCases(cases, { ...EMPTY_CASE_FILTERS, locations: ["beijing"] });
    expect(filtered).toHaveLength(177);
    expect(filtered.every((item) => item.location === "beijing")).toBe(true);
  });

  it("intersects multiple fields", () => {
    const filtered = filterPublicCases(cases, {
      ...EMPTY_CASE_FILTERS,
      locations: ["guangzhou"],
      statuses: ["pending"],
      months: ["2026-08"],
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every(
        (item) =>
          item.location === "guangzhou" &&
          item.status === "pending" &&
          item.checkDate.startsWith("2026-08"),
      ),
    ).toBe(true);
  });

  it("unions values within one field", () => {
    const filtered = filterPublicCases(cases, {
      ...EMPTY_CASE_FILTERS,
      statuses: ["pending", "clear"],
    });
    expect(filtered).toHaveLength(471);
    expect(filtered.every((item) => item.status === "pending" || item.status === "clear")).toBe(
      true,
    );
  });

  it("returns all cases for empty filters", () => {
    expect(filterPublicCases(cases, EMPTY_CASE_FILTERS)).toEqual(cases);
  });

  it("returns an empty result for a nonexistent value", () => {
    expect(filterPublicCases(cases, { ...EMPTY_CASE_FILTERS, months: ["2099-01"] })).toEqual([]);
  });

  it("round-trips canonical multi-select filters through the URL", () => {
    const filters: CaseFilters = {
      locations: ["wuhan", "beijing"],
      statuses: ["clear", "pending"],
      months: ["2026-08", "2026-01"],
      degrees: ["Master"],
      majorGroups: ["STEM", "Unknown"],
      entries: ["renewal", "initial"],
    };
    const parsed = filtersFromSearchParams(filtersToSearchParams(filters));
    expect(filtersEqual(parsed, filters)).toBe(true);
  });

  it("accepts the legacy major URL key while writing majorGroup", () => {
    const parsed = filtersFromSearchParams(new URLSearchParams("major=STEM,Unknown"));
    expect(parsed.majorGroups).toEqual(["STEM", "Unknown"]);
    expect(filtersToSearchParams(parsed).get("majorGroup")).toBe("STEM,Unknown");
    expect(filtersToSearchParams(parsed).has("major")).toBe(false);
  });

  it("keeps row counts and metric counts aligned", () => {
    const filters: CaseFilters = { ...EMPTY_CASE_FILTERS, locations: ["shanghai"] };
    const filtered = filterPublicCases(cases, filters);
    const metrics = calculateMetrics(filtered);
    expect(filtered).toHaveLength(metrics.sampleCount);
    expect(metrics.pendingCount + metrics.clearCount + metrics.rejectCount).toBe(filtered.length);
  });

  it("reconciles national and location totals after filtering", () => {
    const filtered = filterPublicCases(cases, {
      ...EMPTY_CASE_FILTERS,
      statuses: ["pending", "reject"],
      majorGroups: ["STEM"],
    });
    const reconciliation = reconcileCounts(filtered, calculateLocationMetrics(filtered));
    expect(reconciliation.passed).toBe(true);
    expect(reconciliation.locationTotal).toBe(filtered.length);
  });

  it("keeps statuses mutually exclusive", () => {
    const metrics = calculateMetrics(cases);
    expect(metrics.pendingCount + metrics.clearCount + metrics.rejectCount).toBe(cases.length);
  });

  it("is independent of selected-value order", () => {
    const left = filterPublicCases(cases, {
      ...EMPTY_CASE_FILTERS,
      locations: ["beijing", "wuhan"],
      statuses: ["pending", "clear"],
    });
    const right = filterPublicCases(cases, {
      ...EMPTY_CASE_FILTERS,
      locations: ["wuhan", "beijing"],
      statuses: ["clear", "pending"],
    });
    expect(left).toEqual(right);
  });

  it("is idempotent", () => {
    const filters = { ...EMPTY_CASE_FILTERS, majorGroups: ["Business"] };
    const first = filterPublicCases(cases, filters);
    expect(filterPublicCases(first, filters)).toEqual(first);
  });

  it("matches a reference predicate for combined filters", () => {
    const filters: CaseFilters = {
      locations: ["beijing", "shenyang"],
      statuses: ["pending"],
      months: ["2026-02", "2026-08"],
      degrees: ["Doctoral", "Unknown"],
      majorGroups: ["STEM"],
      entries: ["initial"],
    };
    const reference = cases.filter(
      (item) =>
        (filters.locations.length === 0 || filters.locations.includes(item.location)) &&
        (filters.statuses.length === 0 || filters.statuses.includes(item.status)) &&
        (filters.months.length === 0 || filters.months.includes(item.checkDate.slice(0, 7))) &&
        (filters.degrees.length === 0 || filters.degrees.includes(item.degree)) &&
        (filters.majorGroups.length === 0 || filters.majorGroups.includes(item.majorGroup)) &&
        (filters.entries.length === 0 || filters.entries.includes(item.visaEntry)),
    );
    expect(filterPublicCases(cases, filters)).toEqual(reference);
  });
});
