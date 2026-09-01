# 阶段 3Q：`/about` Visual Integration Only

状态：完成 UFun `/about` 的 scoped Checkmate 视觉整理与本地验证；未修改数据、页面外壳、
首页、博客、Header、导航或全局样式；未 push、未部署、未访问 Checkee。

## 范围与保护边界

- UFun 只改动 `components/checkmate/checkmate-experience.tsx` 与
  `components/checkmate/checkmate-experience.module.css`。
- 没有改动 `app/about/page.tsx`、`app/page.tsx`、`app/layout.tsx`、
  `components/header/**`、`data/navigation.ts`、`css/**`、blog、footer、API 或
  `json/checkmate/**`。
- 开始前 UFun worktree 已有大量用户未提交的首页、Header、widget、API、data、package 与
  global CSS 改动；它们保持原状，未加入本阶段 commit。

## 视觉整理

- 把 Checkmate feature switch 从标题之前移到每个视图标题与元信息之后，建立“标题 → 功能
  切换 → 核心数据”的首屏顺序；路由参数与现有按钮语义保持不变。
- 将 feature 内的 surface 收束为 UFun 既有 ambient background 上的轻纸张卡片：克制边界、
  更低阴影、减少 backdrop blur，砖红色只保留在 active switch、Median 和交互重点。
- 微调城市卡、趋势、案例列表和名人堂统计的圆角、分隔线、文字密度与留白，保留 Page1 的
  五城 Q1/Median/Q3、月度趋势与城市案例，以及 Page2 的案例/Approve/分位数与展开行为。
- 移动端继续保持五城的 2+2+1 结构；趋势表在窄屏改为逐月的两列指标小卡，无横向滚动或
  截断。HYBlackMythU 继续复用 UFun 已有静态字体资源。

## 数据与功能保持

- Page1 仍为 503 条、Page2 仍为 97 条 build-time 安全 JSON 快照；本阶段没有重算指标、
  新增数据字段、fetch、runtime import 或依赖。
- `view`、`city` 与无关 query 参数的既有 URL state 逻辑未改；直接访问
  `/about?view=cities&city=beijing` 仍渲染北京案例和分页，
  `/about?view=peers&city=beijing` 仍渲染名人堂。
- 城市排序、每页 10 条、Page1/Page2 pagination、名人堂展开、status 与免责声明均保持。

## 验证证据

- 浏览器：`/about` 在 1440×1000 显示 UFun Header、标题下方的 feature switch、五个城市、
  趋势和城市详情区域；`/about?view=peers&city=beijing` 显示名人堂的紧凑统计 surface。
- 浏览器：390×844 的 `/about?view=cities&city=beijing` document `scrollWidth` 为 375，
  小于 viewport 390；字体加载完成后显示 HYBlackMythU；逐月趋势卡完整可读。
- 浏览器：直接 URL 验证北京详情、案例列表和 Page1 pagination 存在；直接名人堂 URL 验证
  标题、核心指标和展开控件存在。首页 `/` 仍有 `/about` Check 链接；`/blog` 仍显示“目录”。
- UFun 定向 `npx prettier --check`、`npx eslint`、`npm run typecheck` 与 `npm run build`
  全部通过。build 仍只生成 11 个既有 Contentlayer documents；出现既有 Windows
  Contentlayer 与 Node 20 Supabase deprecation warnings，但没有构建失败。

## 限制与下一步

- 浏览器控制层在此轮对 client button click 只留下 active/focus state，未触发 React state
  更新；因此交互回归以既有 Stage 3P 点击证据、直接 URL 状态、按钮/ARIA DOM 与成功
  typecheck/build 为准。本阶段没有变更这些 state handlers。
- `/checkmate-preview` 继续作为既有 regression/debug route，未在本阶段改动。
- UFun 本地 commit：`style: refine checkmate about experience`，仅含上述两个
  `components/checkmate/**` 文件。本报告在 Checkmate repo 单独提交。
