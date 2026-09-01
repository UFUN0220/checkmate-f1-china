# 阶段 3N：UFun 集成准备

状态：完成架构审计与迁移契约；未推送、未部署、未访问 Checkee。由于 UFun 工作树
正在进行跨首页、Header 和全局 CSS 的开发，本阶段没有写入 UFun，也没有创建会混入
现有修改的 UFun prototype commit。

## UFun 审计

- 仓库：`F:\projects_2027\ufun`，分支 `main`，HEAD
  `6214b4cdb99b81a26aa06cb655a72e06e56cb4b1`。
- 技术栈：Next.js 16.2.10、React/React DOM 19.2.7、TypeScript 6.0.3、Tailwind
  v4、App Router/Contentlayer。
- 根布局的所有权明确：`app/layout.tsx` 提供 Header、`main`、Footer、主题和
  字体变量；`data/navigation.ts` 拥有主导航。
- 页面路由为 App Router 文件路由，现有公共页面包括 `/`、`/blog`、`/about` 和
  `/tags`。没有既存 projects 路由模式，因此稳定后的最低风险 preview 采用未进主
  导航的 `/checkmate-preview`。
- 宿主使用 `css/tailwind.css` 的全局 Tailwind token 和 `Container` 的
  `max-w-6xl` 外层容器。首页、关于页有 `body:has(...)` 的特殊 viewport 规则；
  Checkmate preview 不会使用这些 page marker。
- UFun 配置 `BASE_PATH` 和静态导出选项；页面中的公共静态资源会手动拼接
  `BASE_PATH`。
- `public/fonts/HYBlackMythU.woff2` 已存在，且现有 `heishenhua` family 可复用。

审计时 UFun 已有大量不属于本阶段的修改：`.env.example`、首页/天气组件、Header、
`css/tailwind.css`、数据模块和 API route 等已跟踪文件，以及新的 admin route、响应式
主页组件、工具与类型文件。它们保持原样。Git 的目录所有权保护也要求所有读取使用
临时安全目录参数；没有修改 UFun Git 配置。

## Checkmate 就绪度

- 仓库基线：`main`，HEAD `2cd8c94c9c8138aada625be0f69b7367a348362a`。
- Stage 3M 的 `WhiteHouseSelection` 和 `HallOfFame` 是正确的 feature entry
  points；`EvidenceAtlas` 与 `CheckmateNavigation` 是 standalone-only。
- 两个 feature 不在模块导入时触碰 `window`、`document`、`history` 或 URL。后者
  只存在于 standalone shell 的 effect/event handler 中。
- `loadCheckeeSnapshot()` 和 `loadPage2Snapshot()` 是安全 JSON 的构建期导入，
  不含浏览器 fetch、绝对数据 URL 或跨仓库文件路径。Page1 固定 503 条、Page2 固定
  97 条，快照日期均为 2026-09-01。
- 现有 `--checkmate-*` token 已可在 host wrapper 上覆盖。现有字体文件路径和
  Checkmate 全局 CSS 仍不能直接导入 UFun root layout；最终迁移要提取
  feature-only CSS 并复用 UFun 的已注册字体。
- Checkmate 仍维持离线、fail-closed 和 PII 边界：不导入 raw HTML、XLSX、内部
  provenance、解析器或 Checkee 网络访问。

## 选择的集成策略

选择 UFun 的静态 TypeScript/JSON import（原需求 Option B），而非浏览器 fetch 或
跨仓库 runtime import。下一阶段从 Checkmate 的已审核公开 JSON 手动复制至 UFun
的 source data module，再由 host page/client island 将类型化数据传给 feature。

Host owns layout；Checkmate owns feature logic。UFun 控制 route、Header、Footer、
background、外层宽度、gutter 和最终视觉；Checkmate 只控制内部统计、城市选择、列表、
展开与分页。内部 `cities|peers` tab 不升级为 UFun 主导航。

迁移清单已明确：UFun 未来只抽取 `WhiteHouseSelection`、`HallOfFame` 及其局部
渲染 helper、运行时 analytics/presentation/types、两份安全 JSON 和 feature-only CSS；
不复制当前 `components/evidence-atlas.tsx` 整体，因为它同时包含 standalone shell 和
`@phosphor-icons/react` 依赖。`EvidenceAtlas`、`CheckmateNavigation`、全局 CSS、raw
数据、XLSX、adapters、parser、fixtures 和校验脚本均不进入 UFun runtime。

详细的路由、样式 token、资产、字体、依赖和 URL adapter 方案见
[`ufun-integration-plan.md`](../ufun-integration-plan.md)。

## Prototype 和剩余工作

本阶段不创建 prototype，原因是当前 UFun 的宿主边界文件仍有用户未提交改动。这样可
避免写入/提交与用户进行中首页变更耦合的文件，并符合“风险较高时不强行 prototype”的
阶段约束。

稳定后，单独在 UFun 本地 commit 中新增 `/checkmate-preview`、host-owned
`CheckmateExperience`、安全 JSON module 和 feature-scoped stylesheet。该 commit 不
改变主导航、全局布局、博客或首页。随后验证两个组件挂载、五城市、十条分页、名人堂
展开、字体单次加载、1440x1000/390x844 无溢出，并运行 UFun `typecheck`、`build` 和
非破坏性 lint 检查。

## 验证

- 已读取两个仓库的分支、HEAD、工作树、package manager lockfile 和 `package.json`。
- 已审计 UFun 的 root layout、路由、Header/navigation、Container、Tailwind tokens、
  `next.config.js`、字体和 BASE_PATH 使用方式。
- 已审计 Checkmate 的 feature entry points、loader、standalone browser-global usage、
  token scope 和安全快照计数。
- Checkmate 的 `lint`、`typecheck`、55 项 `test`、Page1 503 条和 Page2 97 条
  离线数据校验，以及 production `build` 均通过；两个新增 Markdown 文件已通过
  Prettier 检查。
- 完整 `npm run check:offline` 仍只在既有未跟踪 `pnpm-lock.yaml` 的
  `format:check` 阶段停止；该文件未修改。UFun 未改动，因此没有执行其会写入宿主
  构建缓存的 typecheck/build；这些命令是后续 prototype 的验证 gate。
- 本阶段仅新增文档；没有变更数据、样式、runtime code 或 UFun 文件。
