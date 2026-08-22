/* global console */

import { readFile } from "node:fs/promises";

const snapshot = JSON.parse(await readFile("public/data/checkee-static-snapshot.json", "utf8"));
const manifest = JSON.parse(await readFile("public/data/checkee-static-manifest.json", "utf8"));
const serializedCases = JSON.stringify(snapshot.cases);
let hash = 2166136261;
for (const char of serializedCases) {
  hash ^= char.charCodeAt(0);
  hash = Math.imul(hash, 16777619);
}
const expectedChecksum = `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
const forbidden =
  /(?:comments?|details?|password|email|phone|passport|ds-?160|sevis|case\s*(?:number|id)|wechat|qq)/i;
if (snapshot.manifest.sourceMode !== "manual-html-static")
  throw new Error("Static source mode missing.");
if (snapshot.manifest.isLive !== false) throw new Error("Static snapshot must be non-live.");
if (manifest.snapshotChecksum !== expectedChecksum)
  throw new Error("Static snapshot checksum mismatch.");
if (JSON.stringify(snapshot.cases).match(forbidden))
  throw new Error("Static snapshot contains a forbidden field pattern.");
if (snapshot.cases.length !== snapshot.manifest.recordCount)
  throw new Error("Static record count mismatch.");
if (manifest.snapshotChecksum !== snapshot.manifest.snapshotChecksum)
  throw new Error("Manifest checksum mismatch.");
console.log(
  JSON.stringify({
    valid: true,
    recordCount: snapshot.cases.length,
    checksum: expectedChecksum,
    rawHtmlNotRead: true,
  }),
);
