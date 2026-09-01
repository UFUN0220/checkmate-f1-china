# 阶段 3P：Checkmate `/about` Production Integration

状态：完成本地 `/about` 正式接入、URL/交互/响应式 smoke test、typecheck 与 production
build；未 push、未部署、未访问 Checkee。

## Stage 3O 前置状态

Stage 3O 的 six-file preview integration 在开始时仍为独立暂存状态，尚未有
`feat: add checkmate integration preview` 本地 commit。它包含 preview route、scoped
feature、safe snapshot types 以及 Page1/Page2 JSON。Stage 3P 不复制该实现，而是复用
`CheckmateExperience` 及同一组 JSON。

## UFun worktree safety audit

UFun 仍存在首页、Header、mobile nav、global Tailwind CSS、API、widgets 与 data 等用户
未提交改动。检查 `git diff` 后确认：

- `app/about/page.tsx` 的用户当前状态只留下空的 `about-page` 背景占位，原 README
  内容已经不在该当前版本中；本阶段按明确产品要求将该占位替换为 Checkmate host page。
- `data/navigation.ts` 在本阶段前未修改，因此只改其 `/about` 项的一个显示标签。
- 没有改动 `app/layout.tsx`、`app/page.tsx`、`components/header/**`、
  `css/tailwind.css`、首页、博客、Footer 或 shared UI component。

## Production integration

- `/about` 现在是 server page：构建期 import UFun `json/checkmate/` 的两份安全快照，
  通过 `Suspense` 挂载 shared client `CheckmateExperience`。
- 默认 `/about` 不写 query，显示 `2026年度白宫严选中国F1硕博`、五城市、Q1/Median/Q3、
  月度趋势与城市案例。
- Header navigation 仅将 `README` 显示为 `Check`，href 继续是 `/about`；原有顺序、
  URL、emoji 与 Header implementation 未改。`/about` 和 `/about?view=peers` 都通过
  pathname 自动获得 UFun 既有 active style。
- Compact feature switcher 是 feature 内部控件，不是主站第二层导航：白宫严选与名人堂
  互为清晰入口。名人堂不新增 UFun 主导航项。
- URL state 继续用 Next `usePathname`/`useRouter`/`useSearchParams`。`view=peers`
  表示名人堂；无 `view` 默认白宫严选；`city` 与其他无关参数保留。切换名人堂时特意不
  删除 city，因此返回 Page1 会恢复城市选择；router push 维持 back/forward 历史。

## Data, CSS and accessibility

- Page1 固定 503 条、Page2 固定 97 条，继续来自 Checkmate 已验证公开快照的 build-time
  JSON import；没有 browser fetch、cross-repo runtime import 或业务重算。
- raw HTML、XLSX、H/I/J、学校、comments、contact、provenance、source IDs、parser 和
  adapter 都不进入 UFun runtime。
- `/about` 与 preview 共享 `checkmate-experience.module.css`；未导入 Checkmate
  standalone globals，也没有新 body/background/max-width/navigation shell。UFun 的
  `site-container`、ambient background、theme tokens、Lucide 与现有 HYBlackMythU asset
  继续是 visual source of truth。
- feature switch、城市卡、expand 和 pagination 都是 semantic buttons，带
  `aria-current`/`aria-pressed`/`aria-expanded`、focus-visible 与 reduced-motion support。

## Smoke test evidence

- `/about`：Header DOM 为 `Article`、`Check`，其中 Check href 为 `/about`；默认 h1 为
  白宫严选，五城市和趋势完整渲染。
- 从 `/about?ref=qa` 选择北京后为
  `?ref=qa&view=cities&city=beijing`；Page1 pagination 由 `1 / 19` 到 `2 / 19`。
- 切换名人堂后 URL 为 `?ref=qa&view=peers&city=beijing`；展开后 Page2 pagination
  由 `1 / 10` 到 `2 / 10`；返回白宫严选会恢复北京 city state。
- `/about?view=peers` 在 390×844 可展开分页，document `scrollWidth` 375，小于 viewport
  390；1440×1000 首屏可见标题、五城市和醒目的 feature switch。
- 等待 `document.fonts.ready` 后，`document.fonts.check('16px heishenhua')` 为 true。
- `/checkmate-preview?view=peers` 仍显示名人堂；`/` 与 `/blog` 仍渲染且 Header 中 Check
  的 href 是 `/about`。

## Validation and remaining work

- Stage 3P 文件的 Prettier、targeted ESLint 与 UFun `npm run typecheck` 通过。
- UFun build 最初被 `.next/checkmate-preview-dev.err.log` 的 `EBUSY` 锁阻断。经用户确认，
  仅停止了已核验的 UFun `next dev` / child processes；日志锁解除后，最终
  `npm run build` 和 postbuild RSS generation 均通过。路由输出包含静态 `/about` 和
  `/checkmate-preview`，Contentlayer 只生成 11 个既有 content documents，不再扫描安全
  snapshot JSON。
- UFun `npm run lint` 自带 `--fix`，未运行以保护用户未提交工作。
- Commit 状态：Stage 3O preview 已独立提交为 UFun `7fd150a`
  (`feat: add checkmate integration preview`)；Stage 3P `/about`、`data/navigation.ts` 和
  shared city-preservation 改动已独立提交为 UFun `f1fb1aa`
  (`feat: integrate checkmate into about page`)。本报告在 Checkmate repo 单独提交，未混入
  3N/3O 既有未跟踪文档或其他用户文件。
- `/checkmate-preview` 暂时保留用于 regression/debug。后续 Stage 3Q 只需做视觉密度、
  switch composition、Page2 card hierarchy 与 mobile polish；不再修改数据路径或架构。
