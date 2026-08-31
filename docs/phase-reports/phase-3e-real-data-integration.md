# 阶段 3E：真实静态数据接入与验证报告

日期：2026-08-31
状态：完成（本地静态快照；无联网抓取）

## 结果摘要

阶段 3E 已完成。本阶段只读取本地 `data/raw/2601.html`–`data/raw/2608.html`，没有访问 Checkee、读取 Cookie、使用代理或配置定时抓取。快照截止日固定为 `2026-08-31`，`CHECKEE_ACCESS_MODE` 仍保持 `disabled`。

输入共 1,463 行，1,463 行成功解析；其中 F-1 候选 573 条，按稳定源 ID 去重后纳入五地点公开快照 475 条。公开快照标记 `isMock=false`，页面继续显示 `STATIC SNAPSHOT` 和非实时说明；Peer Sample 100 条、Hall of Fame 10 条仍是明确标注的 mock 数据。

## HTML 结构与字段映射

实际检查了 8 个页面。每页标题为 `Check Reporter`，包含 8 个 table；恰有一个数据表，11 列为：

`Update | ID | Visa Type | Visa Entry | US Consulate | Major | Status | Check Date | Complete Date | Waiting Day(s) | Details`

没有发现分页残留、隐藏重复表、移动/桌面双表或未知列。`ManualCheckeeHtmlAdapter` 只接受这套已确认的本地结构；表头漂移、列数错误、缺少源 ID、非法日期/等待日等情况 fail closed 并进入隔离报告。

字段处理如下：

- `Visa Type` 只按显式 F-1 alias 白名单纳入；当前文件实际出现的其他签证类型均排除。
- `US Consulate` 只按北京、上海、广州、沈阳、武汉及代码中的确认变体纳入。
- `Status` 保留 Checkee 的 `Pending`、`Clear`、`Reject` 语义，不改写成官方或预测性状态。
- `Check Date`、合法 `Complete Date` 统一为 ISO 日期；`0000-00-00` 归一化为空。
- `Waiting Day(s)` 仅作审计对照；Pending age 统一用固定截止日计算，Clear duration 使用实际合法结束日，Reject 不参与 resolved duration。
- `Major` 只派生低维 degree、majorGroup、majorCategory；空专业和未知字段保留为 `Unknown`。
- `ID`、`Update`、`Details` 仅保留在本地忽略的 provenance 输出，不进入公开 JSON 或前端 bundle。

## 去重、快照重建与数据质量

稳定源 ID 去重移除 125 行；其中精确重复 5 行，另有 5 个可能重复指纹组保留两边并记录为 `UNRESOLVED_KEEP_BOTH`，不会擅自合并。对账为：

`1,463 = 475 纳入 + 863 非重复排除 + 125 去重移除 + 0 隔离`

本次实际公开结果为 Pending 262、Clear 209、Reject 4；没有未来结果、未知状态、非法日期或隔离行。五地点样本量为：北京 177、上海 34、广州 158、沈阳 55、武汉 51。统计引擎对分组样本执行 `n < 5` 隐藏、`5–9` 小样本标记，并在页面保留分母。

若记录的 Complete Date 晚于 `2026-08-31`，快照重建会将其在截止日视为 Pending，effective end date 改为截止日，并从公开结果中移除未来 Complete Date；该规则由单元测试覆盖。本次 8 个真实输入文件没有触发未来结果。

详细字段覆盖、文件 SHA-256、排除原因和样本审计见 [数据验证报告](../data-validation-report-2026-08-31.md)。

## 产物与架构边界

- `npm run data:parse`：读取 `data/raw`，生成公开快照、manifest、检查报告和本地 normalized provenance。
- `public/data/checkee-static-snapshot.json`：前端唯一读取的真实静态公开快照。
- `public/data/checkee-static-manifest.json`：来源、截止日、数量、质量和非实时元数据。
- `data/generated/checkee-static-ingest-report.json`：不含源 ID、Details 或 HTML 的安全审计产物。
- `data/normalized/`：本地可追溯标准化记录，已加入 `.gitignore`，不提交。
- `data/raw/`：本地原始 HTML，已加入 `.gitignore`，不提交。

数据获取与处理已经解耦：DemoFixtureAdapter、CheckeeExportAdapter、ManualCheckeeHtmlAdapter 输出同一套 NormalizedCase，统计和页面不依赖 HTML。未来只有获得明确授权后才能实现/启用网络型 Checkee adapter；当前真实抓取命令会明确失败并保持 fail closed。

## 验证记录

本阶段执行：

- `npm run data:parse`
- `npm run data:checkee:validate`
- `npm run check:offline`
- `npm run data:checkee:fetch`（预期失败：`CHECKEE_ACCESS_MODE=disabled`）
- `git diff --check`
- 本地浏览器回归：桌面概览、移动端概览、地点下钻、Hall 页面；阶段 3D 视觉结构未重设计，真实公开区不显示 `DEMO DATA`，Peer/Hall 保留该标记。

验证结论：`npm run check:offline` 退出码为 0；`npm run data:checkee:fetch` 退出码为 1，且仅输出 disabled/fail-closed 提示，没有发起网络请求。本阶段已创建本地 commit `feat: integrate stage 3e checkee snapshot data`。不 push、不部署。

## 限制

这是开发者本地提供的手工 HTML 静态快照，不是实时同步，也不代表全部申请人、官方处理速度、成功概率或个案结果。当前访问状态仍为 `CHECKEE_ACCESS_BLOCKED`；在授权前不得补写生产抓取器或绕过访问限制。
