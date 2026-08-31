import type { RawCaseInput } from "./normalize";
import { DATA_SNAPSHOT } from "./snapshot-config";

const SNAPSHOT_DATE = DATA_SNAPSHOT.cutoffDate;

function isoDate(month: number, day: number) {
  return new Date(Date.UTC(2026, month - 1, day)).toISOString().slice(0, 10);
}

function dayDifference(start: string, end: string) {
  return Math.round(
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000,
  );
}

const locationSpecs = [
  {
    name: "广州",
    statuses: [
      "Pending",
      "Pending",
      "Clear",
      "Clear",
      "Reject",
      "Pending",
      "Clear",
      "Pending",
      "Pending",
      "Clear",
      "Pending",
      "Clear",
    ],
  },
  {
    name: "北京",
    statuses: [
      "Pending",
      "Clear",
      "Pending",
      "Reject",
      "Clear",
      "Pending",
      "Clear",
      "Pending",
      "Clear",
    ],
  },
  { name: "沈阳", statuses: ["Pending", "Pending", "Clear", "Reject", "Pending", "Clear"] },
  { name: "武汉", statuses: ["Pending", "Clear", "Pending", "Reject", "Pending"] },
  { name: "上海", statuses: ["Pending", "Clear", "Pending", "Clear"] },
] as const;

const majors = [
  "Computer Science",
  "Business",
  "Education",
  "",
  "Unknown",
  "Mechanical Engineering",
];

export const DEMO_RAW_CASES: RawCaseInput[] = (() => {
  const records: RawCaseInput[] = [];
  let id = 1;

  for (const [locationIndex, spec] of locationSpecs.entries()) {
    for (const [caseIndex, status] of spec.statuses.entries()) {
      const currentId = id;
      const month = ((currentId - 1) % 7) + 1;
      const day = 3 + ((currentId * 3) % 22);
      const checkDate = currentId === 11 ? "2026-08-03" : isoDate(month, day);
      const completeDate =
        status === "Clear" || status === "Reject"
          ? currentId === 17
            ? "2026-08-18"
            : isoDate(month, day + 8 + ((currentId * 5) % 28))
          : null;
      const sourceMonth = currentId === 7 ? "2026-01" : checkDate.slice(0, 7);
      const expectedDays =
        status === "Pending"
          ? dayDifference(checkDate, SNAPSHOT_DATE)
          : completeDate
            ? dayDifference(checkDate, completeDate)
            : null;

      records.push({
        sourceRecordKeyInternal: `demo-${String(currentId).padStart(3, "0")}`,
        publicId: `demo-case-${String(currentId).padStart(3, "0")}`,
        visaTypeRaw: "F-1",
        visaEntryRaw: caseIndex % 3 === 0 ? "New" : caseIndex % 3 === 1 ? "Renewal" : "",
        consulateRaw: spec.name,
        majorRaw: majors[(currentId + locationIndex) % majors.length],
        sourceStatusRaw: status,
        checkDate,
        completeDate,
        waitingDaysReported:
          currentId === 7 && expectedDays !== null ? expectedDays + 3 : expectedDays,
        sourceMonth,
      });
      id += 1;
    }
  }

  records.push(
    {
      sourceRecordKeyInternal: "demo-037",
      publicId: "demo-case-037",
      visaTypeRaw: "J-1",
      visaEntryRaw: "New",
      consulateRaw: "北京",
      majorRaw: "Education",
      sourceStatusRaw: "Pending",
      checkDate: "2026-03-12",
      completeDate: null,
      waitingDaysReported: 163,
      sourceMonth: "2026-03",
    },
    {
      sourceRecordKeyInternal: "demo-038",
      publicId: "demo-case-038",
      visaTypeRaw: "F1",
      visaEntryRaw: "New",
      consulateRaw: "成都",
      majorRaw: "Business",
      sourceStatusRaw: "Clear",
      checkDate: "2026-04-08",
      completeDate: "2026-04-29",
      waitingDaysReported: 21,
      sourceMonth: "2026-04",
    },
    {
      sourceRecordKeyInternal: "demo-039",
      publicId: "demo-case-039",
      visaTypeRaw: "F1",
      visaEntryRaw: "Renewal",
      consulateRaw: "上海",
      majorRaw: "Computer Science",
      sourceStatusRaw: "Pending",
      checkDate: "2026-09-01",
      completeDate: null,
      waitingDaysReported: null,
      sourceMonth: "2026-09",
    },
    {
      sourceRecordKeyInternal: "demo-040",
      publicId: "demo-case-040",
      visaTypeRaw: "F1",
      visaEntryRaw: "New",
      consulateRaw: "武汉",
      majorRaw: null,
      sourceStatusRaw: "Maybe",
      checkDate: "2026-05-16",
      completeDate: null,
      waitingDaysReported: null,
      sourceMonth: "2026-05",
    },
    {
      sourceRecordKeyInternal: "demo-041",
      publicId: "demo-case-041",
      visaTypeRaw: "F1",
      visaEntryRaw: "New",
      consulateRaw: "广州",
      majorRaw: "Mechanical Engineering",
      sourceStatusRaw: "Clear",
      checkDate: "2026-05-20",
      completeDate: "2026-05-12",
      waitingDaysReported: -8,
      sourceMonth: "2026-05",
    },
    {
      sourceRecordKeyInternal: "demo-001",
      publicId: "demo-case-042",
      visaTypeRaw: "F1",
      visaEntryRaw: "New",
      consulateRaw: "广州",
      majorRaw: "Computer Science",
      sourceStatusRaw: "Pending",
      checkDate: "2026-06-01",
      completeDate: null,
      waitingDaysReported: 82,
      sourceMonth: "2026-06",
    },
  );

  return records;
})();
