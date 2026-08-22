export const DISPLAY_FIELD_CONFIG = {
  primaryMetrics: [
    "sampleCount",
    "pendingCount",
    "pendingAgeMedianDays",
    "clearCount",
    "resolvedDurationMedianDays",
    "locationCounts",
    "coverageMonths",
  ],
  locationDetailFields: [
    "sampleCount",
    "statusDistribution",
    "pendingAgeMedianDays",
    "pendingAgeP75Days",
    "pendingAgeMaxDays",
    "resolvedDurationMedianDays",
    "visaEntryDistribution",
    "degreeDistribution",
    "majorGroupDistribution",
    "monthDistribution",
  ],
  caseListFields: [
    "status",
    "location",
    "checkDate",
    "pendingAgeDays",
    "resolvedDurationDays",
    "visaEntry",
    "degree",
    "majorGroup",
  ],
  hiddenTechnicalFields: [
    "update",
    "sourceRecordKeyInternal",
    "sourceFileName",
    "sourceId",
    "details",
    "comments",
    "rawHtml",
  ],
} as const;

export type DisplayFieldConfig = typeof DISPLAY_FIELD_CONFIG;
