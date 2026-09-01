# 阶段 3M：Checkmate 集成准备

状态：完成本地实现，未推送，未部署，未执行真实抓取。

## 目标与结果

- 新增稳定的公开入口：`components/checkmate/index.ts` 导出
  `WhiteHouseSelection`、`HallOfFame`、`CheckmateNavigation` 和 standalone
  `EvidenceAtlas`。
- Page1 功能组件接收安全 `PublicSnapshot`，支持初始/受控城市选择；城市
  统计、趋势、详情和分页均从传入快照计算。
- Page2 功能组件接收安全 `Page2Snapshot`，本地维护展开状态与分页，保留
  97 条案例、Q1 54、Median 75、Q3 89 的冻结口径。
- 新增 `loadCheckeeSnapshot` 与 `loadPage2Snapshot`，将生成的公开 JSON 与
  展示组件隔离；原始 HTML、私有记录和 `page2.xlsx` 不进入运行时入口。
- `EvidenceAtlas` 保留 standalone-only 的导航、URL 状态、方法说明、页脚
  和 viewport shell；功能组件不读取 `window`、`document`、`history` 或 URL
  查询参数。
- 页面结构、路由 key、数据字段、隐私门禁和 offline 边界未改变；没有新增
  Checkee 网络访问或生产解析器。
- 全局自定义 `html/body/button/a/*` 样式改为 standalone/feature 边界内规则；
  shell 负责背景和 body reset，feature 使用可由宿主覆盖的 `--checkmate-*`
  token。`HYBlackMythU.woff2` 仍为现有单一字体资源。
- 新增 [`docs/checkmate-integration.md`](../checkmate-integration.md)，记录
  挂载方式、loader、静态资源、CSS、URL 与安全边界。

## 验收记录

新增测试覆盖：

- standalone shell 的既有 Page1/Page2 行为与 URL 兼容性；
- `<WhiteHouseSelection />` 在带 URL 的测试环境中独立渲染且不修改 URL；
- `<HallOfFame />` 独立渲染且不创建 standalone 导航；
- 两个 snapshot loader 的 503/97 记录数与 Page2 quartile 对账。

本阶段预期命令：

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npm run data:checkee:validate
npm run data:page2:validate
npm run build
```

本地结果：`npm run lint`、`npm run typecheck`、`npm test`（55 tests）、两个数据
校验和 `npm run build` 均通过；本阶段文件的 Prettier 检查也通过。完整的
`npm run check:offline` 在 `format:check` 阶段被仓库外已有的未追踪
`pnpm-lock.yaml` 阻断，提示该文件格式不符；该文件不属于本阶段，未修改或纳入
提交。此前阶段报告的格式问题已在基线提交 `64a7454` 中修复。

如果格式检查命中阶段报告文件，只格式化本阶段报告和本阶段修改文件；不改动
历史报告或用户已有未追踪文件。手工数据校验脚本的既有 esbuild 环境限制仍按
前阶段记录处理，不通过绕过网络方式解决。

## 后续输入

个人网站接入时应在宿主 wrapper 上提供背景、排版和 spacing 决策，并将 Checkmate
样式与字体作为可迁移资源处理。未来如获得明确 Checkee 授权，只需实现新的
adapter 输出同一套 `NormalizedCase`/公开快照契约；本阶段不授权、不启用真实抓取。
