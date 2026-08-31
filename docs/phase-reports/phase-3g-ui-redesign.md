# Stage 3G：基于 UFun 设计语言的 UI 重设计报告

## 阶段状态

- 基线：`7c6c709 feat: polish stage 3f data presentation`
- 本阶段目标：重做信息架构与界面层，不改变 Stage 3E/3F 的数据处理、统计、解析器和来源边界。
- 数据状态：城市页使用真实静态公开快照（475 条，截止 `2026-08-31`）；Peer 与 Hall 当前使用 `DEMO DATA` mock 回退。
- 授权状态：`CHECKEE_ACCESS_BLOCKED`；没有执行真实抓取，也没有访问 Checkee 网络页面。

## UFun 生产界面审计

已审阅 `F:\projects_2027\ufun` 的实际生产代码与样式，包括 header、mobile navigation、Container、PageHeader、Button、卡片和全局 Tailwind 主题。

保留的设计启发：

- 居中、有限宽度的内容容器和稳定的移动端左右留白。
- 桌面端紧凑的悬浮/粘性导航，当前页面使用清晰的 active underline。
- 纸张背景、白色表面、细边界、柔和阴影和克制的圆角层次。
- 以排版层级和留白建立信息结构，交互色只用于状态和行动提示。
- 移动端导航保持清晰、可触达，避免依赖桌面布局缩小。

有意没有复制：UFun 首页的浮动画布、bento 卡片堆叠、渐变/玻璃装饰、首页项目展示结构和品牌蓝色按钮体系。Checkmate 的核心是数据阅读，不应被装饰或 dashboard 组件抢走注意力。

## App shell / 导航

- 将原先单页长滚动结构改为三个独立顶层视图：`城市等待`、`同学样本`、`Check 名人堂`。
- 导航链接使用 `?view=cities|peers|hall`，点击采用 History API 更新地址，`popstate` 同步浏览器前进/后退。
- `?city=` 继续保留，并在城市下钻时自动保持 `view=cities`；切换到 Peer/Hall 时清除城市选择，避免状态串页。
- 顶部快照标签按页面显示：城市页为 `STATIC SNAPSHOT`，Peer/Hall 为 `DEMO DATA`。

## 三个独立视图

### 城市等待

- 页面标题和说明收紧为紧凑 header。
- 五个地点仍为北京、上海、广州、沈阳、武汉。
- 城市卡片以 Median 为最大层级，Q1/Q3 为辅助层级，公开案例数和统计 `n` 分开表达。
- 点击城市后显示状态构成、统计口径和当前城市案例；公开案例按 duration 降序，首屏 20 条，按钮每次追加 20 条。

### 同学样本

- 页面不再和城市数据同屏，使用独立 header、Q1/Median/Q3 指标和紧凑案例行。
- 当前空手工输入自动回退 mock，并在页面标题、案例行和页脚持续显示 `DEMO DATA`。
- 仍保留手工 Peer 数据入口和同一套 `CheckCase` 输出契约。

### Check 名人堂

- 页面独立展示最长等待 Top 10。
- Top 3 使用有层次但克制的 featured 行；#4–10 使用更紧凑的排名行。
- 排名数据仍来自既有 Hall loader 与统计函数，未新增预测或个性化功能。

## 紧凑案例行

城市公开案例和 Peer 样本共用 `CaseList` / `CaseCard` 展示结构：duration、Pending/Clear/Reject、日期范围、地点/匿名样本和 F-1/entry 信息。没有把原始 HTML、Comments、Details 或个人标识带入浏览器端。

## 响应式与可访问性

- 桌面端使用有限宽度容器和五地点横向概览；窄屏自动变为两列城市卡片。
- 案例行在窄屏切换为 duration + 主信息两列，日期允许换行，避免 `66.5` 等值和时间范围被裁切。
- 导航使用真实链接并添加 `aria-current="page"`；城市卡片使用按钮、`aria-pressed` 和可读的完整 aria label。
- 保留 `prefers-reduced-motion` 规则；交互元素具备 focus-visible 状态。

## 视觉 QA

- 已完成源代码级 desktop/mobile 样式检查、组件渲染测试和生产 build 检查。
- 按浏览器 skill 尝试使用 Codex 内置 Browser 打开 `http://localhost:3000`，被当前环境的 localhost 自动安全策略拒绝；没有使用 CDP、替代浏览器、Cookie 或其他绕过方式。
- 因此本阶段不宣称完成真实浏览器截图验收；该限制已记录，后续应在允许本地预览的环境做 desktop、mobile、三视图和 URL 恢复的人工验收。

## 测试与构建

以下检查均通过：

- `npm test`：9 个测试文件，44 个测试通过。
- `npm run lint`
- `npm run typecheck`
- `npm run format:check`
- `npm run data:manual:validate`：Peer 输入 0 / mock 输出 100；Hall 输入 0 / mock 输出 10。
- `npm run check:offline`：通过；静态数据校验为 475 条，`rawHtmlNotRead=true`。
- `npm run build`：Next.js 静态构建通过。

抓取 fail-closed 验证：`npm run data:checkee:fetch` 明确输出 `CHECKEE_ACCESS_MODE=disabled` 并退出失败；没有网络请求。

## 限制与下一阶段输入

- Peer/Hall 仍没有真实授权数据，当前 mock 只能用于开发和截图，不能对外宣称为 Checkee 数据。
- 城市页是静态快照，不是实时处理时间，也不代表总体概率、官方 SLA 或个人结果。
- 本阶段没有改变 Checkee adapter、原始快照、统计公式、PII 门禁和离线 CI。
- 下一阶段可在获得授权并拿到 CSV/JSON 或明确许可后，仅新增/启用对应 adapter；页面和统计入口无需重写。
- 未 push、未部署生产。
