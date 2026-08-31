# Checkmate Data Validation Report

Snapshot:
2026-08-31

Source:
Local manually supplied Checkee HTML

Network access:
None

Raw HTML files:

- data/raw/2601.html
- data/raw/2602.html
- data/raw/2603.html
- data/raw/2604.html
- data/raw/2605.html
- data/raw/2606.html
- data/raw/2607.html
- data/raw/2608.html

## Structure inspection

The eight supplied pages each contain one Check Reporter data table plus unrelated tables. The data table has one header row and no pagination residue, hidden duplicate table, or mobile/desktop duplicate. Repeated header rows: one per page. All pages use the following confirmed columns:

| HTML column    | Normalized mapping                                      |
| -------------- | ------------------------------------------------------- |
| Update         | local audit metadata; not displayed                     |
| ID             | sourceRecordKeyInternal; local provenance only          |
| Visa Type      | visaTypeRaw → explicit F1 allowlist                     |
| Visa Entry     | visaEntryRaw → visaEntry                                |
| US Consulate   | consulateRaw → explicit five-city allowlist             |
| Major          | majorRaw → degree / majorGroup / majorCategory          |
| Status         | sourceStatusRaw → status                                |
| Check Date     | checkDate → YYYY-MM-DD                                  |
| Complete Date  | completeDate → YYYY-MM-DD; future result reconstructed  |
| Waiting Day(s) | audit-only source field; duration uses effectiveEndDate |
| Details        | local raw provenance only; never public                 |

No `UNKNOWN FIELD MAPPING` remains for the supplied files. `ID` and `Details` are retained only in the ignored local normalized output and are not included in the public snapshot.

## Overall counts

- Raw HTML rows: 1463
- Parsed rows: 1463
- F-1 rows before dedupe: 573
- Included public F-1 cases: 475
- Non-duplicate excluded rows: 863
- Confirmed duplicate rows removed by stable source ID: 125
- Exact identical duplicate rows among those: 5
- Suspected duplicate groups retained: 5
- Future result rows reconstructed as Pending at cutoff: 0
- Pending: 262
- Resolved: 213
- Approved (Clear): 209
- Refused (Reject): 4
- Other / unknown excluded: 0
- Invalid / malformed excluded: 0

Accounting: 1463 = 475 included + 863 non-duplicate excluded + 125 duplicate rows removed + 0 schema-isolated rows.

No UNACCOUNTED RECORDS.

## Exclusion reasons

- Non-F1: 835
- Unknown city: 28
- Unknown status: 0
- Invalid date: 0
- Resolved missing end date: 0
- Out-of-range date: 0
- Confirmed duplicate rows removed: 125
- Schema-isolated rows: 0
- Other malformed records: 0

## City validation

## Beijing

Sample size: 177
Pending: 89
Resolved: 88
Approved (Clear): 86
Refused (Reject): 2
Invalid excluded: 0

Q1: 44 days
Median: 63 days
Q3: 97 days
Minimum: 1 days
Maximum: 238 days

## Shanghai

Sample size: 34
Pending: 23
Resolved: 11
Approved (Clear): 11
Refused (Reject): 0
Invalid excluded: 0

Q1: 49.8 days
Median: 66.5 days
Q3: 81.5 days
Minimum: 0 days
Maximum: 188 days

## Guangzhou

Sample size: 158
Pending: 95
Resolved: 63
Approved (Clear): 61
Refused (Reject): 2
Invalid excluded: 0

Q1: 46 days
Median: 62.5 days
Q3: 82 days
Minimum: 1 days
Maximum: 160 days

## Shenyang

Sample size: 55
Pending: 29
Resolved: 26
Approved (Clear): 26
Refused (Reject): 0
Invalid excluded: 0

Q1: 40 days
Median: 60 days
Q3: 74 days
Minimum: 4 days
Maximum: 237 days

## Wuhan

Sample size: 51
Pending: 26
Resolved: 25
Approved (Clear): 25
Refused (Reject): 0
Invalid excluded: 0

Q1: 41.5 days
Median: 60 days
Q3: 77 days
Minimum: 1 days
Maximum: 202 days

## Input file hashes

| File      | Rows | SHA-256                                                          |
| --------- | ---: | ---------------------------------------------------------------- |
| 2601.html |  234 | 316db0d500f15ff712a6f5c9c02c32e954893643fdaa3aa54d3c350109ea32e6 |
| 2602.html |  133 | a20f0d6f122180089a11f404cb9032724ade6bc55a24c19c43b5e270ae156389 |
| 2603.html |  182 | 825f40f498a7e0ca5f023d0cd69a8ce6092448e294900ac3fc44e14d60ba5e5a |
| 2604.html |  187 | da68d503ba1a8ffc7a432efc888f4f232fb2d3f4497d3745dca8557006b10b67 |
| 2605.html |  261 | baad2dfbd654d7ff3d0df50bf6a413404d0c8994530000552b96426a362ca40d |
| 2606.html |  258 | b75a0c0fc6cdd868cd02e0acec05d3b2228c918cdef512547cb3ca7011c8e4bf |
| 2607.html |  173 | f20d9ef411a331f046871c538501fe00ab57a5ff56596a68daa4d34f1b2391a9 |
| 2608.html |   35 | 318965dbff905239202f48df9e8c1a3fccadf6b5ab89a173af9b83da3b173c3a |

## Snapshot and output

- Snapshot cutoff: `2026-08-31`
- Pending effective end date: `2026-08-31`
- Resolved effective end date: original valid `Complete Date` on or before cutoff
- Duration function: `calculateDurationDays(startDate, effectiveEndDate)` using calendar days; same day is 0
- Public output: `public/data/checkee-static-snapshot.json`
- Local traceable normalized output: `data/normalized/public-f1-checks.json`
- Local metadata: `data/normalized/public-f1-checks.meta.json`
- Inspection output: `data/generated/checkee-static-ingest-report.json`

## Privacy and product boundary

- The frontend imports only the public snapshot; it never imports raw HTML or local normalized provenance.
- Public cases are real local Checkee snapshot records and are no longer marked `DEMO DATA`.
- Peer Sample remains 100 mock records and Hall of Fame remains 10 curated mock records; both retain `DEMO DATA`.
- `STATIC SNAPSHOT` remains because this is not realtime data.
- The dataset is descriptive public-sample evidence, not official processing time, probability, prediction, or an individual outcome.
