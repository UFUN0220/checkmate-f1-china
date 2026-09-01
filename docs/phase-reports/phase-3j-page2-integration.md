# 阶段 3J：Page2 数据集接入与名人堂合并报告

日期：2026-09-01  
状态：完成（本地、离线、未推送）  
建议 commit：`feat: integrate stage 3j page2 dataset`

## 目标

在不改变 Page1（Checkee 静态快照城市等待页）行为的前提下，接入独立的 `data/raw/page2.xlsx`，将其转换为来源独立的标准化记录和公开安全静态产物，并把旧的独立 Hall 入口合并为 Page2 的可展开案例列表。

## XLSX 结构核验

- 工作表：`Sheet1`。
- 第 1 行为表头；检查到第 198 行，表头之外共 197 行物理行，其中 97 行有数据、100 行为空格式行。
- E 列 `面签日期` → `startDate`。
- F 列 `状态` → `status`；实际值为 `Approve`（11）和 `Check`（86），因此明确映射为 `approved` 与 `pending`，没有使用 G 列反推状态。
- G 列 `结束日期` → `endDate`；为空时使用固定快照日期 `2026-09-01`。
- 等待时间为 E 到 G（或快照日）的 calendar-day difference，同一天为 0 天。
- H、I、J 按非空值过滤并用 `; ` 合并。J 无表头，记录为 mapping ambiguity。
- 未发现公式行；E 日期范围为 `2026-04-07` 至 `2026-08-17`。

## 数据结果

| 指标                |  结果 |
| ------------------- | ----: |
| 合法案例            |    97 |
| Approved            |    11 |
| Pending / Other     |    86 |
| 等待天数总和        | 7,098 |
| 等待天数样本        |    97 |
| 平均等待天数        |  73.2 |
| 缺失 G 的记录       |    88 |
| 有 H/I/J 内容的记录 |    71 |

产物为 [`page2-static-snapshot.json`](/F:/projects_2027/checkmate/public/data/page2-static-snapshot.json)，由 `npm run data:page2:import` 生成，并由 `npm run data:page2:validate` 校验。浏览器端只读取该公开 JSON，不读取 XLSX。

## 隐私与字段边界

H 是学校字段，I/J 是未经审核的备注文本；实际 J 中发现联系样式字符串。因此标准化阶段完成 H/I/J 的合并审计和计数，但 `mergedInfo` 在公开 `Page2Case` 中固定为 `null`。公开案例只保留日期、状态、等待天数、学位和专业，避免学校、评论、联系方式或可回溯文本进入前端 bundle、静态产物或测试快照。

## 页面变化

- Page1 城市等待、城市下钻、月度趋势和 Checkee 静态来源提示保持原行为。
- 顶部导航现在只有“城市等待”和“同学样本”。
- Page2 默认只展示 Total Cases、Approved Cases、Average Waiting Days 三项指标。
- “名人堂”作为 Page2 展开按钮；展开后展示全部 97 条安全案例，按 `startDate` 升序，每页最多 10 条。
- `?view=hall` 规范化为 `?view=peers`；旧 `?view=trend` 继续回到城市页。
- Page2 持续显示 `PAGE2 STATIC`、快照日期和非实时说明，不使用 `DEMO DATA` 口吻。
- 名人堂标题沿用 Stage 3I 的 `HYBlackMythU` 字体；其余页面结构仅增加轻量 iOS 风格卡片，不进行大范围重构。

## 离线与授权状态

- `CHECKEE_ACCESS_MODE` 保持 `disabled`。
- 没有执行真实 Checkee 抓取，没有使用 Cookie、代理、缓存拼接或定时任务。
- `data/raw/page2.xlsx` 属于本地输入，未提交；提交的仅是经过公开边界和校验的 JSON、质量报告及代码。
- 本阶段仍不代表 Checkee 官方数据，也不提供总体概率、官方处理时长或个人结果预测。

## 验证记录

本阶段已通过：

- Page2 日期解析、状态映射、空 G、等待日、H/I/J 合并、隐私抑制、统计对账、排序和分页测试。
- 原有 Page1 测试、lint、typecheck、Page2 静态数据校验和 build。
- 真实抓取命令继续 fail closed，并明确提示 `CHECKEE_ACCESS_MODE=disabled`。

验证结果：`npm test` 为 10 个测试文件、53 个测试通过；`npm run lint`、`npm run typecheck`、`npm run data:checkee:validate`、`npm run data:page2:validate` 和 `npm run build` 通过。浏览器级验收被本地浏览器安全审查阻断，未进行绕过；React DOM 测试覆盖了默认折叠、展开、10 条分页、旧 Hall 路由和旧趋势路由回退。

工作区的全局 `npm run format:check` 仍会报告一个本阶段之前已存在且未纳入提交的 `pnpm-lock.yaml`；所有 Stage3J 文件单独执行 Prettier check 均通过。`npm run data:manual:validate` 仍因既有脚本依赖但未安装的 `esbuild` 无法运行；本阶段未扩大依赖变更来掩盖该基线问题。`check:offline` 因上述格式问题在第一步停止，但已单独运行其余离线校验与 build。

## 下一阶段输入

后续若要替换 Page2 来源，只需实现同一标准化输出的适配器，并重新生成安全静态产物；不得让 React 直接依赖 XLSX、原始备注或未经审核字段。Checkee HTML 适配器仍须等待明确授权，且不能改变当前默认禁用策略。
