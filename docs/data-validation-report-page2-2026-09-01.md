# Page2 数据校验报告（2026-09-01）

## XLSX inspection

- File: `data/raw/page2.xlsx`
- Sheet: `Sheet1`
- Header row: 1
- Data rows inspected: 197（不含表头，包含空行）
- E: 面签日期 → startDate
- F: 状态 → status（Approve/Approved → approved；Check/Pending → pending）
- G: 结束日期 → endDate；为空时使用固定快照日 `2026-09-01`
- H: 学校（可选，原始字段，仅合并审计，不公开）
- I: 备注（原始字段，仅合并审计，不公开）
- J: 无表头但存在备注文本，mapping ambiguity；仅合并审计，不公开
- Formula rows: 0

## Validation summary

| Metric                    | Count/value |
| ------------------------- | ----------: |
| Raw rows                  |         197 |
| Parsed rows               |          97 |
| Included rows             |          97 |
| Invalid rows              |           0 |
| Blank rows                |         100 |
| Total cases               |          97 |
| Approved                  |          11 |
| Pending/Other             |          86 |
| Missing G rows            |          88 |
| Invalid E rows            |           0 |
| Invalid G rows            |           0 |
| G < E rows                |           0 |
| Total waiting-day sum     |        7098 |
| Valid waiting-day records |          97 |
| Average waiting days      |        73.2 |
| Date min                  |  2026-04-07 |
| Date max                  |  2026-08-17 |

## Privacy boundary

H/I/J were merged with the required semicolon rule during normalization and audited as 71 non-empty source rows. They are suppressed from the public snapshot because H is a school field and I/J are unreviewed notes; this prevents school, comments/details and contact-like strings from entering the frontend bundle. Public cases retain only safe date, status, waiting-days, degree and major fields.
