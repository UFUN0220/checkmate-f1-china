# Checkmate Data Validation Report

Snapshot:
2026-09-01

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

- Raw HTML rows: 1519
- Parsed rows: 1519
- F-1 rows before dedupe: 606
- Included public F-1 cases: 503
- Non-duplicate excluded rows: 884
- Confirmed duplicate rows removed by stable source ID: 132
- Exact identical duplicate rows among those: 5
- Suspected duplicate groups retained: 7
- Future result rows reconstructed as Pending at cutoff: 0
- Pending: 263
- Resolved: 240
- Approved (Clear): 236
- Refused (Reject): 4
- Other / unknown excluded: 0
- Invalid / malformed excluded: 0

Accounting: 1519 = 503 included + 884 non-duplicate excluded + 132 duplicate rows removed + 0 schema-isolated rows.

No UNACCOUNTED RECORDS.

## Exclusion reasons

- Non-F1: 856
- Unknown city: 28
- Unknown status: 0
- Invalid date: 0
- Resolved missing end date: 0
- Out-of-range date: 0
- Confirmed duplicate rows removed: 132
- Schema-isolated rows: 0
- Other malformed records: 0

## City validation

## Beijing

Sample size: 183
Pending: 87
Resolved: 96
Approved (Clear): 94
Refused (Reject): 2
Invalid excluded: 0

Q1: 43.5 days
Median: 63 days
Q3: 96.5 days
Minimum: 1 days
Maximum: 239 days

## Shanghai

Sample size: 39
Pending: 23
Resolved: 16
Approved (Clear): 16
Refused (Reject): 0
Invalid excluded: 0

Q1: 51 days
Median: 63 days
Q3: 82 days
Minimum: 0 days
Maximum: 189 days

## Guangzhou

Sample size: 170
Pending: 95
Resolved: 75
Approved (Clear): 73
Refused (Reject): 2
Invalid excluded: 0

Q1: 44 days
Median: 62 days
Q3: 81.8 days
Minimum: 1 days
Maximum: 161 days

## Shenyang

Sample size: 57
Pending: 30
Resolved: 27
Approved (Clear): 27
Refused (Reject): 0
Invalid excluded: 0

Q1: 40 days
Median: 55 days
Q3: 74 days
Minimum: 4 days
Maximum: 238 days

## Wuhan

Sample size: 54
Pending: 28
Resolved: 26
Approved (Clear): 26
Refused (Reject): 0
Invalid excluded: 0

Q1: 41 days
Median: 57 days
Q3: 76.8 days
Minimum: 1 days
Maximum: 203 days

## Input file hashes

| File      | Rows | SHA-256                                                          |
| --------- | ---: | ---------------------------------------------------------------- |
| 2601.html |  234 | 4f0330aa298870d41b6dd0e41fa1c79e106d57ec625b0c561837a5699a49241d |
| 2602.html |  133 | b234c7be3548eb7c93266545adf9e8b00eaae691f9165a0697ded56be603cf04 |
| 2603.html |  182 | ac33f35630ae2f4a33b12afc2885599cf6fba4669b257d627b814729856c89c0 |
| 2604.html |  187 | b2250bc6a88c31c9231b236703c7eb47afda1ca543c284ddb1661c3a3327da3a |
| 2605.html |  262 | 648908dd862b583dae2cf583dd42c6ebc6eea29f6fa049c6c2aacd16c5c54329 |
| 2606.html |  272 | 83c97e9ffc8d3a9cc976d2d362794b6e7abc9c380534dce248eb2c200e330bc7 |
| 2607.html |  198 | 336b050fe3eb6078a4ea7f08941603cec841c103976bc17fab72bceb471c2740 |
| 2608.html |   51 | d1dee18318626477fd19f1689bb0b247861e405b030e904c2c9f98fcff9fe817 |

## Snapshot and output

- Snapshot cutoff: `2026-09-01`
- Pending effective end date: `2026-09-01`
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
