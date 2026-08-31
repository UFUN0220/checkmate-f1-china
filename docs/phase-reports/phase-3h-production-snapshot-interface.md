# Stage 3H：Production Snapshot & Minimal Information Design

## 阶段状态

- 基线：`ced85ad feat: redesign stage 3g checkmate interface`
- 目标：将 Checkmate 收敛为几秒钟可读的轻量工具，并加入独立的全国 F-1 月度趋势视图。
- 快照：本地静态 Checkee HTML 重新生成，快照时间为 `2026-09-01 00:00`。
- 当前公开案例：503 条；Pending 263、Clear 236、Reject 4。
- 授权状态：`CHECKEE_ACCESS_BLOCKED`；未执行网络抓取。

## 生产 snapshot

日期统一集中到 `lib/data/snapshot-config.ts`：

- `cutoffDate=2026-09-01`
- `timestamp=2026-09-01T00:00:00Z`
- `displayTimestamp=2026-09-01 00:00`

静态产物已重新生成并写入 `public/data/checkee-static-snapshot.json`、`public/data/checkee-static-manifest.json` 和新的静态审计报告。原始本地 HTML 仍只在导入阶段读取，未进入提交。

## UFun 审计与复用边界

继续参考 `F:\projects_2027\ufun` 的实际生产界面：compact header、居中容器、active underline、纸张背景、白色表面、细边界、柔和圆角、克制阴影和清晰排版层级。

本阶段进一步减少装饰和卡片数量，只保留数字需要的轻量信息块。没有复制 UFun 的 Bento 拼贴、浮动画布、复杂渐变或品牌页面结构，也没有把 Checkmate 改成 BI dashboard、企业 SaaS 或管理后台。

## App shell / navigation

- 顶部导航固定为：`城市等待`、`趋势分析`、`同学样本`、`Check 名人堂`。
- 导航高度、logo 区域和内边距进一步压缩，active underline 保留。
- URL 使用 `?view=cities|trend|peers|hall`；城市下钻仍使用 `?city=`，浏览器前进/后退通过 `popstate` 恢复。
- 城市等待与趋势页显示 `STATIC SNAPSHOT`；Peer/Hall 显示 `DEMO DATA`。

## View 1：城市等待

- 首页标题直接显示“中国 F-1 Check 等待情况”和“截至 2026-09-01 00:00”。
- 五个地点卡片只展示 Q1、Median、Q3 三个数字；Median 更大、更醒目，Q1/Q3 muted。
- 隐藏城市卡片中的状态数、样本数、最大/最小值等后台式信息；城市 accent 只作为小点、Median 强调和 selected state。
- 点击城市后在同一视图内显示紧凑详情和少量案例验证行，不展开长页面。

## View 2：趋势分析

- 新增独立 `趋势分析` 视图，不与城市卡片混在同一页面。
- 只统计 F1；按 `Check Date` 所属月份生成 2026-01 至 2026-08 的 Pending、Clear、Total 和 Average Waiting Days。
- `Total = Pending + Clear`，Reject 不进入趋势指标。
- Complete Date 为默认未完成值时计为 Pending，并使用固定 `2026-09-01 - Check Date`；Complete Date 非默认值时沿用原始状态，Clear 的平均等待直接使用来源 `Waiting Day(s)`。
- 页面使用一张轻量趋势表，不新增复杂图表或 dashboard grid。
- 底部 Jan–Aug 汇总使用等待天数总和除以有效记录数，不对月平均值做简单平均；摘要为 Pending 263、Clear 236、Total 499。

## View 3：同学样本

- 保持独立 Peer 数据入口和统一 `CheckCase` 模型。
- 首页重点是 Q1、Median、Q3 和“匿名样本”；仅保留少量紧凑案例行用于验证。
- 当前手工输入为空，回退 100 条 mock，并在页面持续显示 `DEMO DATA`。

## View 4：Check 名人堂

- 保持轻松的小彩蛋定位，不做 leaderboard dashboard。
- Top 3 使用轻量颜色、奖章和称号区分，不使用领奖台、金币或闪烁动画。
- #4–10 使用紧凑行：排名、匿名称号、日期和 duration；仍按 duration 降序。

## Compact case row

案例行改为 52–60px 左右的信息密度：duration 是首要视觉、status 第二、日期第三、地点/专业分类第四。删除大标题、大 badge、大 padding 和独立卡片感。城市和 Peer 共用 `CaseList` / `CaseCard`，前端仍只读取公开安全模型。

## Responsive / accessibility

- 1440×1000 桌面目标是每个视图的主要内容首屏完成：导航、页面标题、核心数据和主要验证内容不再组成一个长 dashboard。
- 390×844 使用紧凑四项导航、两列城市信息块、堆叠趋势行和无横向滚动的 Hall 行。
- 趋势表在移动端转换为每月两列信息块，不依赖横向滚动。
- 顶部导航使用真实链接和 `aria-current`；城市块使用按钮、`aria-pressed` 和完整 aria label；趋势表保留 table role；保留 keyboard focus 和 reduced-motion 支持。

## Tests / data validation

新增并覆盖：

- F1-only monthly filtering。
- `0000-00-00` / `null` Complete Date 的 Pending 判定。
- Complete Date 非默认值时使用来源 Waiting Days 的 Clear 平均值。
- Jan–Aug 月度归属、加权平均、Total 对账。
- 新 snapshot date `2026-09-01`。

已通过：

- `npm test`：9 个测试文件，45 个测试通过。
- `npm run lint`
- `npm run typecheck`
- `npm run format:check`
- `npm run data:checkee:validate`
- `npm run data:manual:validate`
- `npm run check:offline`
- `npm run build`

`npm run data:checkee:fetch` 继续 fail closed，明确输出 `CHECKEE_ACCESS_MODE=disabled` 并退出；没有网络请求。

## Visual QA / limitations

- 已完成 CSS/source inspection、组件渲染测试和生产 build 检查。
- 尝试使用 Codex 内置 Browser 打开 `http://localhost:3000`，被当前环境 localhost 安全策略拒绝；没有使用 CDP、替代浏览器、Cookie 或其他绕过方式。
- 因此本阶段不宣称完成真实浏览器截图验收；后续应在允许本地预览的环境确认 1440×1000、390×844、四个 URL view、`?city=` 恢复和无横向滚动。
- 不改变 parser architecture、provenance boundary、offline guard、fail-closed 机制或 manual data contract。
- Peer/Hall 仍为开发 mock，不能宣传为 Checkee 真实数据；城市页仍是非实时描述性静态快照。
- 未 push、未部署生产。
