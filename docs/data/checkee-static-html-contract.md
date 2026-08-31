# Checkee 手工 HTML 静态快照契约

版本：`3b-static-html-v1`
状态：`CHECKEE_ACCESS_BLOCKED`，仅用于离线导入和开发验证。
快照导入时间：2026-08-23；覆盖 2026-01 至 2026-08，2026-08 标记为未完整月份。

## 来源和边界

本阶段使用用户在本地提供的 8 个已保存 HTML 文件：`2601.html` 至 `2608.html`。文件来自 Checkee.info 的月份页，但本项目不宣称与 Checkee.info 有隶属关系，也不把静态快照称为实时数据。导入器不访问 Checkee，不读取 Cookie，不接受 URL，也没有定时任务。

原始 HTML 目录 `dataset_*` 只允许本地存在，已被 `.gitignore` 忽略。提交的只有经过解析、归一化、公开字段门禁和敏感字段扫描后的 JSON 快照、manifest 和安全导入报告。

## 已观察 DOM 结构

8 个页面均为 UTF-8、标题 `Check Reporter`，页面文本包含 `Tracker (2026-MM)`，每页有 8 个 table。唯一的数据表是第一个行包含以下 11 个单元格表头的 table；页面没有 `<thead>`，表头和数据均为 `td`：

```text
Update | ID | Visa Type | Visa Entry | US Consulate | Major |
Status | Check Date | Complete Date | Waiting Day(s) | Details
```

解析策略是：

1. 从本地文件名取得月份，并与页面 `Tracker (2026-MM)` 交叉校验。
2. 在所有 table 中定位恰好一个同时包含 `Visa Type` 和 `Check Date` 的数据表。
3. 对表头做空白、大小写和显式 alias 归一化；未知列、重复必需列、缺失必需列均 fail closed。
4. 逐行要求 11 个 cell；重复表头、错误列数、缺失源 ID、非法 Waiting Day(s) 和必需字段缺失进入隔离报告，不进入归一化记录。
5. `Update`、`ID`、`Details` 只用于解析/审计，不进入 `PublicCase`。`Details` 中的链接、图片、自由文本不会进入构建产物。

导入报告仅保留文件名、月份、大小、SHA-256、编码、标题、table 数量、表头名称、分页/空状态观察结果、敏感列名称和计数，不保留行 ID、Details 或 HTML 内容。

## 归一化和纳入规则

- Visa Type 只接受 `F1`、`F-1`、`F 1`（大小写和空白归一化后）；其他类型保留为候选但排除。
- 地点白名单只接受北京、上海、广州、沈阳、武汉及代码中的确认拼写变体；香港、Others 和其他领馆排除。
- Status 只接受 `Pending`、`Clear`、`Reject`；未知状态排除。
- Check Date 必须为合法 ISO 日期、位于 2026-01-01 至 2026-08-31；月份冲突、未来日期、非法日期和反向日期进入质量报告或排除。
- `0000-00-00` 是源页面的未完成占位值，归一化为 `null`，不是非法日期。Clear 没有合法 Complete Date 会排除；Pending 可以保留。
- Visa Entry 归一化为 `initial`、`renewal` 或 `unknown`；空专业归为 `Unknown`。
- Degree 和 Major Group 是从 `Major` 得到的低维、可审计分类；无法安全判断时为 `Unknown`。

同一内部源 ID 只保留第一条候选；精确重复和可能重复分别记录在导入报告和 `DataQualityReport`。可能重复是相同匿名指纹组的组数，不是原始行数，不能解释为确定重复。

## 统计口径

- Pending age 与 Clear resolved duration 是两个不同字段。Pending 统一使用固定快照截止日 `2026-08-31 - Check Date`；来源 `Waiting Day(s)` 只做审计对照，不能覆盖固定截止日计算。
- Clear duration 使用 Complete Date 减 Check Date；Reject 不参与 resolved duration。
- 页面筛选为同一字段内 OR、不同字段间 AND；支持地点、状态、Check 月份、Degree、Major Group 和 Initial/Renewal，并将筛选状态写回 URL。
- `n < 5` 不展示分位数结论；`5–9` 标记小样本；所有指标带样本量或分母。
- 地点占比只能称为“Checkee F-1 公开样本分布”，不代表领馆比例、总体概率或个案结果。

## 本次静态快照审计结果

| 项目                     |                     结果 |
| ------------------------ | -----------------------: |
| 原始数据行               |                    1,463 |
| 解析候选                 |                    1,463 |
| 隔离行                   |                        0 |
| 公开案例                 |                      475 |
| 排除/去重后差额          |                      988 |
| 精确重复                 |                        5 |
| 可能重复指纹组           |                       10 |
| Pending / Clear / Reject |            262 / 209 / 4 |
| Check 日期范围           | 2026-01-05 至 2026-08-21 |

地点样本为北京 177、上海 34、广州 158、沈阳 55、武汉 51。全国及地点指标均由公开案例的 `durationDays` 计算，并持续显示样本量；以上只是该静态公开样本的描述性统计。

`waitingDayMismatchCount=0` 不能解释为来源字段已被实时验证：来源 `Waiting Day(s)` 只作为审计字段，Pending age 不使用本次导入时间，也不使用该来源值覆盖固定截止日计算；Clear 仍按 Check Date 和 Complete Date 计算。完整质量明细见 `data/generated/checkee-static-ingest-report.json` 和公开 manifest。

## 未来启用条件

本适配器不是生产抓取器。只有在获得明确授权、重新确认 source contract、字段结构和访问频率后，才可以另行实现并启用 `CheckeeHtmlAdapter`。授权前不得把本地静态快照改写成实时同步，也不得通过 Cookie、代理、缓存或验证码绕过访问限制。
