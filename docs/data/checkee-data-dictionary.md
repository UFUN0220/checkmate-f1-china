# Checkee 数据字典

状态：阶段 3B；字段名和枚举已由本地手工保存 HTML 静态快照确认。该快照不是实时访问授权，生产 `CheckeeHtmlAdapter` 仍保持 disabled。

## 分层原则

```text
Checkee HTML（私有、短期缓存）
        ↓ 解析与 schema guard
raw/internal normalized record（不进入前端）
        ↓ 字段最小化与敏感信息扫描
public snapshot（供页面读取）
```

原始评论、Details、身份字段、来源记录 ID、完整 URL 参数和抓取正文永远不进入公开层。

## 内部 raw / normalized 字段

| 字段                      | 层级              | 规则                                                                                                                     |
| ------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `sourceRecordKeyInternal` | internal          | 内部匹配/去重用；不公开，不由邮箱、学校、备注或完整原始行的普通哈希生成。                                                |
| `visaTypeRaw`             | raw/internal      | 保留来源原值供审计；只有白名单 alias 才能得到 `visaType = F1`。                                                          |
| `visaType`                | normalized/public | 固定为 `F1`；未知或模糊值排除。                                                                                          |
| `visaEntryRaw`            | raw/internal      | 来源原值；不得把未知值猜成 Initial 或 Renewal。                                                                          |
| `visaEntry`               | normalized/public | `initial`、`renewal` 或 `unknown`。                                                                                      |
| `consulateRaw`            | raw/internal      | 来源地点原值，仅用于审计和映射。                                                                                         |
| `location`                | normalized/public | `beijing`、`shanghai`、`guangzhou`、`shenyang`、`wuhan`；未知地点排除。                                                  |
| `majorRaw`                | raw/internal      | 仅在内存/私有审计阶段使用；不得把自由文本直接公开。                                                                      |
| `majorCategory`           | normalized/public | 低维归类值；无法安全归类为 `Other` 或 `Unknown`。                                                                        |
| `degree`                  | normalized/public | 从 `Major` 得到的 `Doctoral`、`Master`、`Bachelor` 或 `Unknown`；不公开原始专业自由文本。                                |
| `majorGroup`              | normalized/public | 与当前低维专业分组一致的筛选字段；值为 `STEM`、`Business`、`Humanities & Social Science`、`Other` 或 `Unknown`。         |
| `sourceStatusRaw`         | raw/internal      | 保留来源状态原值；不把 `Clear` 改成 `Issued`，不把 `Reject` 宣传为最终拒签。                                             |
| `status`                  | normalized/public | `pending`、`clear`、`reject`、`unknown`。`unknown` 默认不进入公开指标。                                                  |
| `checkDate`               | normalized/public | 合法 ISO 日期；只纳入 `>= 2026-01-01` 的记录。                                                                           |
| `completeDate`            | normalized/public | 仅来源明确且合法时保留；Pending/Reject 通常为空。                                                                        |
| `waitingDaysReported`     | internal          | 来源 `Waiting Day(s)`；静态 HTML 的 Pending age 可使用其公开数值，但会标注 `source_waiting_days`，不把它当作实时增长值。 |
| `sourceMonth`             | normalized/public | 来源月份页面，例如 `2026-01`；不是日期真值。                                                                             |
| `fetchedAt`               | internal/manifest | 页面获取时间；不作为 Check 月份。                                                                                        |
| `snapshotDate`            | public/manifest   | 本次数据快照日；仅在没有可信来源 Waiting Day(s) 时用于 Pending age 推导。                                                |
| `dataQualityFlags`        | internal/manifest | 日期冲突、未知值、重复候选、结构异常等质量标记；不含原文。                                                               |

## 公开记录最小字段

公开案例首版只允许：

`publicId`、`visaType`、`visaEntry`、`degree`、`majorGroup`、`location`、`majorCategory`、`status`、`checkDate`、`completeDate`、`pendingAgeDays`、`pendingAgeSource` 或 `resolvedDurationDays`、`sourceMonth`、`snapshotDate`。

禁止公开姓名、联系方式、学校、护照、DS-160、SEVIS、CEAC Case Number、原始记录 ID、Comments、Details、原始 HTML 和可回溯身份的来源链接。

## 日期与时长公式

```text
pendingAgeDays = source Waiting Day(s)（若可信）或 snapshotDate - checkDate
resolvedDurationDays = completeDate - checkDate
```

- `pendingAgeDays` 只用于 `status = pending`，静态页面优先显示来源 `Waiting Day(s)` 并标记其来源；没有可信来源值时才代表截至快照日的日期差，不是预计完成时间。
- `resolvedDurationDays` 只用于 `status = clear` 且 `completeDate` 合法的案例。
- Reject 不参与 resolved duration。
- Clear 的日期计算值与来源 `Waiting Day(s)` 不一致时写入质量报告；静态 Pending 没有可信的当前页面时间时不使用导入时间制造 mismatch。
- `sourceMonth` 与 `checkDate` 冲突时保留日期真值并标记质量问题；月份页不能替代记录日期。
- 未来日期、反向日期、空日期和无法解析日期不得静默进入指标。

## 稳定枚举与排除规则

- F-1 alias 必须显式白名单；不得用“包含字母 F”模糊匹配。
- 地点只接受五地白名单及有证据支持的拼写变体。
- 任何结构异常、缺列、关键字段变化或访问控制响应都必须拒绝生成新快照。
- 排除报告至少按 `non_f1`、`unknown_location`、`out_of_range_date`、`unknown_status`、`invalid_date`、`duplicate_candidate`、`schema_guard_failed` 和 `access_blocked` 计数。
