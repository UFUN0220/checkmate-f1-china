import { mkdirSync, writeFileSync } from "node:fs";
/* global console */
import { resolve } from "node:path";

const cutoffDate = "2026-08-31";
const locations = ["beijing", "shanghai", "guangzhou", "wuhan", "shenyang"];

function isoDate(month, day) {
  return new Date(Date.UTC(2026, month - 1, day)).toISOString().slice(0, 10);
}

function differenceInDays(start, end) {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000);
}

function addDays(value, days) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function createCase({ id, source, city, status, startDate, endDate = null }) {
  const effectiveEndDate = endDate ?? cutoffDate;
  return {
    id,
    source,
    city,
    visaType: "F1",
    startDate,
    endDate,
    effectiveEndDate,
    status,
    rawStatus: status === "pending" ? "Pending" : status === "clear" ? "Clear" : "Reject",
    durationDays: differenceInDays(startDate, effectiveEndDate),
    isMock: true,
  };
}

const peerCases = Array.from({ length: 100 }, (_, index) => {
  const id = index + 1;
  const pending = id % 4 !== 0;
  const month = 4 + (id % 5);
  const day = 1 + ((id * 7) % 24);
  const startDate = isoDate(month, day);
  const duration = 18 + ((id * 13) % 78);
  const endDate = pending ? null : isoDate(month, Math.min(day + duration, 28));
  return createCase({
    id: `peer-${String(id).padStart(3, "0")}`,
    source: "peer",
    city: null,
    status: pending ? "pending" : id % 8 === 0 ? "reject" : "clear",
    startDate,
    endDate,
  });
});

const hallDurations = [230, 218, 203, 191, 184, 176, 168, 159, 148, 137];
const hallResolvedStartDates = [
  "2026-01-01",
  "2026-01-15",
  "2026-01-20",
  "2026-01-25",
  "2026-02-01",
];
const hallCases = hallDurations.map((duration, index) => {
  const pending = index < 4 || index === 7;
  const startDate = pending
    ? addDays(cutoffDate, -duration)
    : hallResolvedStartDates[(index - 4) % hallResolvedStartDates.length];
  return createCase({
    id: `hall-${String(index + 1).padStart(2, "0")}`,
    source: "hall-of-fame",
    city: locations[index % locations.length],
    status: pending ? "pending" : index % 3 === 0 ? "reject" : "clear",
    startDate,
    endDate: pending ? null : addDays(startDate, duration),
  });
});

const publicCases = Array.from({ length: 20 }, (_, index) => {
  const id = index + 1;
  const startDate = isoDate(5 + (index % 3), 2 + (index % 20));
  const pending = index % 3 !== 0;
  return createCase({
    id: `mock-public-${String(id).padStart(3, "0")}`,
    source: "checkee",
    city: locations[index % locations.length],
    status: pending ? "pending" : "clear",
    startDate,
    endDate: pending ? null : isoDate(8, Math.min(31, 4 + index)),
  });
});

const outputDir = resolve("data/generated");
mkdirSync(outputDir, { recursive: true });
for (const [name, records] of [
  ["mock-public-cases.json", publicCases],
  ["mock-peer-cases.json", peerCases],
  ["mock-hall-of-fame.json", hallCases],
]) {
  writeFileSync(resolve(outputDir, name), `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

console.log(
  JSON.stringify({
    publicCases: publicCases.length,
    peerCases: peerCases.length,
    hallOfFame: hallCases.length,
  }),
);
