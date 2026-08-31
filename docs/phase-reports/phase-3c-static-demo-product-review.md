# 阶段 3C：真实静态数据 Demo 产品化与视觉验收

状态：已完成离线产品化、数据审计和本地浏览器验收。当前快照不是实时同步，在线 Checkee 适配仍保持 disabled。

## 1. 可追溯输入与当前状态

- 基线 commit：`d5b4a358586a441768504aee75e0fa2b14beda3a`。
- 输入：8 个本地手工保存的 Checkee 月份 HTML，覆盖 `2026-01` 至 `2026-08`。
- 运行状态：`DATA_SOURCE_MODE=manual-static`、`DATASET_STATUS=STATIC_SNAPSHOT_DEMO`、`CHECKEE_ACCESS_MODE=disabled`。
- 页面入口只读取 `public/data/checkee-static-snapshot.json`；不执行线上请求、不读取 Cookie、不提供 Detail 页面。
- 快照内容哈希：`fnv1a-727b5c59`；2026-08 标记为 `PARTIAL_MONTH`。

## 2. 独占式总账与重复记录审计

原始候选记录共 1,463 条。采用“首个 source key 保留，后续同 key 计为 duplicate”的独占分类后，对账式为：

```text
1,463 = 835 non_f1 + 28 unknown_location + 125 duplicate removals
       + 0 other exclusions + 475 included
988 = 863 non-target exclusions + 125 duplicate removals
```

旧版 `excludedCountByReason` 仍保留在 manifest 作为重叠诊断字段，不用于上述独占等式。

- 确认重复：5 条重复行，均为同一 source key、同一文件内的完全重复；不是移动端/桌面端 DOM 双份。5 条均移除。
- 可能重复组：10 组；其中 5 组为 `CONFIRMED_DUPLICATE`，另 5 组 source key 不同，证据不足，结论为 `UNRESOLVED_KEEP_BOTH`，全部保留。
- 指纹组诊断总数：76 组；实际移除重复行：125 条。指纹为不可逆 hash，不进入公开案例。

## 3. 80+ 条抽样审计

- 逐月抽取 10 条，共 80 条；每条核对 9 个字段，共 720 个字段检查。
- 720/720 匹配，0 个字段不匹配：Visa Type、Visa Entry、US Consulate、Major、Status、Check Date、Complete Date、Waiting Day(s)、source month。
- 覆盖到 Clear/Pending/Reject、Initial/Renewal、5 个允许地点及其他地点、Complete Date 空值与非空值。
- 实际 80 条抽样没有出现字面空 Major，也没有出现 raw `F-1` alias；fixture 测试覆盖 alias 白名单和未知字段路径。该限制已记录，不能据此宣称生产字段覆盖完整。
- `Update`、内部 `ID`、`Details` 只做导入审计或隐藏技术字段，不进入公开模型、页面或日志。

## 4. 公开结果与统计口径

公开案例共 475 条：Pending 262、Clear 209、Reject 4；地点为北京 177、上海 34、广州 158、沈阳 55、武汉 51。全国 Pending age 中位数/P75/最长值为 68/94/230 天；Clear resolved duration 中位数/P75 为 50/64 天。

Pending duration 与 Clear resolved duration 使用不同语义但统一日期规则：Pending 使用固定 `2026-08-31 - checkDate`；已结束记录使用 `completeDate - checkDate`；Reject 不进入 resolved duration。所有分组统计都携带分母，`n < 5` 不做分组结论，`5–9` 标记为样本较少。

## 5. 字段分层与信息架构

- Level 1 全国概览：公开案例数、Pending/Clear/Reject 构成、Pending age、Clear duration、地点分布、覆盖月份。
- Level 2 地点下钻：地点样本量、状态构成、Pending age 中位数/P75/最长值、Clear duration、Initial/Renewal、Degree、Major Group、月度分布。
- Level 3 标准化案例列表：status、location、checkDate、pendingAgeDays、resolvedDurationDays、visaEntry、degree、majorGroup；支持状态、地点、月份和入口筛选，筛选状态写入 URL。
- 隐藏字段：Update、内部 source key、source file、source ID、Details/Comments、原始 HTML。
- 移动端将筛选器折叠为 filter drawer，保留首屏状态、核心指标和下钻路径；桌面端展示地图式地点分布、指标卡和趋势表。

## 6. 本地浏览器验收

- Desktop：Chrome headless，视口 `1440×1000`，页面加载、首屏指标、五地点分布和静态快照标识可见。
- Mobile：Chrome headless，视口 `390×844`，标题正常换行，核心指标两列布局，来源状态和下钻路径可见，无横向页面溢出。
- 验收截图只保留在本地工作区，不作为本阶段 commit 内容。
- 之前的 hosted browser 无法访问 localhost，分类为 `EXTERNAL_BROWSER_POLICY_BLOCKED`；这不影响本地 HTTP 和 Chrome 验收。

## 7. 验证与运行方式

- `npm test`：7 个测试文件，30 个测试通过。
- `npm run typecheck`：通过。
- `npm run data:checkee:validate`：通过独占对账、公开数量和重复移除门禁。
- `npm run check:offline`：作为本阶段最终门禁，覆盖 format、lint、typecheck、test、静态数据校验和 build。
- 启动命令：`npm run dev`。
- 本地地址：`http://localhost:3000`。

## 8. 已知边界与下一步评审

这是一个手工静态快照 Demo，不代表 Checkee 总体概率、官方处理速度或具体个案结果；不自动刷新、不预测出签日期、不实现真实抓取。获得明确授权后，只需新增输出同一 `NormalizedCase` 的适配器，统计和页面无需改写。

请用户下一步只评审四项：核心指标层级、地点下钻信息密度、案例列表字段优先级、移动端筛选器的展开/收起方式。确认后再进入授权数据适配器或其他来源接入，不在本阶段启用网络抓取。
