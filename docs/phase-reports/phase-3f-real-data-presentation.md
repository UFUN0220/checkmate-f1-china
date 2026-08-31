# 阶段 3F：真实数据展示与手工数据接入报告

日期：2026-08-31
状态：实现完成；浏览器实测受本机 localhost 自动审查策略限制

## 1. Stage 3E 冻结边界

本阶段没有修改 Checkee HTML parser、selector、dedupe strategy、snapshot reconstruction、cutoff date、provenance architecture 或 `CHECKEE_ACCESS_MODE=disabled`。Public 仍读取 `public/data/checkee-static-snapshot.json`，截止日仍为 `2026-08-31`，真实公开案例仍为 475 条。

## 2. Public UI 变化

- Public hero 现在明确显示 `REAL PUBLIC DATA`、475 个“公开 F-1 案例”和 `STATIC SNAPSHOT`。
- 城市卡片将 Q1 / Median / Q3 改为普通中文主文案：“较快的 25%”“中位等待”“较慢的 25%”，并保留 Q1 / Q3 作为次级解释。
- Median 继续是卡片的视觉中心；没有增加图表、BI 导航或额外 KPI。
- 城市案例按 `durationDays DESC` 展示，默认先显示 20 条，每次追加 20 条。
- 城市详情补充公开案例数、统计样本 n 和 Pending/Clear/Reject 构成；案例卡不暴露 provenance。

## 3. 样本语义审计

当前 analytics 的 `calculateWaitStats()` 使用所有具有有效 `durationDays` 的记录，因此 `WaitStats.sampleSize` 是实际参与 Q1 / Median / Q3 的等待时长记录数。城市 `sampleCount` 是公开案例总数；当前真实快照五个城市的 duration 均有效，所以两者数值相同，但 UI 分开展示，避免未来混淆。

`calculateMetrics().resolvedSampleCount` 只使用 Clear 的 `resolvedDurationDays`；Reject 不参与 resolved duration，但会保留在公开案例数和等待时长分布中。该语义已增加单元测试和方法说明。

## 4. 显示格式与城市详情

统一 `formatDays()`：整数不显示 `.0`，非整数最多显示一位小数。因此 `63`、`66.5`、`49.8` 保持为 `63`、`66.5`、`49.8`。桌面和移动端复用同一 formatter。移动案例卡不再强制日期单行，避免 390px 宽度下溢出；列表保持卡片结构，不使用横向大型 table。

## 5. Peer 手工数据契约

入口为 `data/manual/peer-sample.json`，最小字段为 `id`、`startDate`、`status`，可选 `endDate`、`note`。validator 检查唯一 ID、ISO 日期、合法状态、resolved end date、日期顺序、未来结束日期重建和禁止个人识别信息。

当前文件为空数组，因此自动回退现有 100 条 mock；metadata 为 `isMock=true`，页面保留 `DEMO DATA`。未来填入合法匿名数组后，无需改 React，页面将自动使用 `isMock=false` 的手工数据。

## 6. Hall 手工数据契约

入口为 `data/manual/hall-of-fame.json`，最小字段为 `id`、`startDate`、`status`，可选 `endDate`、`displayName`、`subtitle`。不接受真实姓名、联系方式或其他个人识别信息。

duration 始终由 start/end 或固定 cutoff 计算；Hall 独立于 Public，不从 Public 自动生成。展示层使用 duration 降序排序并取 Top 10，前三名继续保留 Gold / Silver / Bronze 及轻量称号。当前空数组回退 10 条 mock，并保留 `DEMO DATA`。

统一校验命令为 `npm run data:manual:validate`；非空且无效的手工文件会 fail closed，不静默回退 mock。

## 7. Dataset 状态

Public、Peer、Hall 的 metadata 独立管理：

| Dataset | 当前状态      | 页面标识                              |
| ------- | ------------- | ------------------------------------- |
| Public  | real          | `REAL PUBLIC DATA`、`STATIC SNAPSHOT` |
| Peer    | mock fallback | `DEMO DATA`                           |
| Hall    | mock fallback | `DEMO DATA`                           |

## 8. 验证

已通过：

- `npm test`：9 个测试文件，43 个测试通过
- `npm run lint`
- `npm run typecheck`
- `npm run format:check`
- `npm run data:manual:validate`
- `npm run check:offline`
- `npm run build`
- `npm run data:checkee:fetch`：按预期退出码 1，保持 disabled / fail closed，未联网

阶段 3D 已有 1440×1000 桌面、390×844 移动、城市下钻和 Hall 的本地视觉截图，本阶段沿用同一单页结构。尝试对本阶段页面进行 localhost 浏览器复测时，本机 Browser 自动审查策略拒绝访问 `http://localhost:3000`；没有使用替代浏览器、CDP 或绕过策略，因此本报告不宣称本阶段完成了新的浏览器实测签字。组件测试、响应式 CSS 审查和生产构建均通过。

## 9. 已知限制

Peer/Hall 尚无产品负责人提供的真实匿名数据，当前仍是 mock。Public 仍是手工静态快照，不是实时数据；它描述公开样本，不代表总体概率、官方处理时间或个人结果。未 push、未部署。
