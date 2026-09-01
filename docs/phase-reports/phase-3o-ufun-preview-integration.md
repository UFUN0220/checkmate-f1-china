# 阶段 3O：UFun Checkmate Preview Integration

状态：完成本地 preview 实现与浏览器 smoke test；未 push、未部署、未访问 Checkee。
UFun 仍是唯一宿主，Checkmate 仅以安全数据与功能逻辑进入 `/checkmate-preview`。

## 工作树保护

开始时 UFun 位于 `main`，HEAD 为
`6214b4cdb99b81a26aa06cb655a72e06e56cb4b1`。其工作树已有首页、Header、mobile nav、
`css/tailwind.css`、API、homepage data、widgets 和 utility 等用户未提交修改。

本阶段没有修改 `app/layout.tsx`、`app/page.tsx`、`components/header/**`、
`data/navigation.ts`、`css/tailwind.css`、首页、博客、Footer 或任何现有 shared component。
所有 UFun 新增文件均局限于：

```text
app/checkmate-preview/page.tsx
components/checkmate/checkmate-experience.tsx
components/checkmate/checkmate-experience.module.css
data/checkmate/types.ts
json/checkmate/checkee-static-snapshot.json
json/checkmate/page2-static-snapshot.json
```

## Route、client boundary 和 URL state

- `/checkmate-preview` 是不在 `HEADER_NAV_LINKS` 中的 no-index App Router preview route。
- page 是 server component，构建期静态 import 两份 JSON，并用 `Suspense` 包住需要
  `useSearchParams` 的 client `CheckmateExperience`。
- client feature 使用 `usePathname`、`useRouter`、`useSearchParams` 处理
  `view=cities|peers` 和 `city=<五地之一>`。更新时复制全部原有 search params，只变更
  `view`/`city`；例如 `?ref=qa` 在城市选择与 view 切换后仍保留。
- 没有复制 Checkmate 的 standalone `EvidenceAtlas`、`CheckmateNavigation`、浏览器
  `history` adapter、shell、footer 或 body setup。

## Runtime feature 与数据

- `WhiteHouseSelection` 迁为 UFun scoped 的城市 feature：五城市、Q1/Median/Q3、
  1–8 月 Pending/Clear/Total/Average Waiting 趋势、按 Check Date DESC 的城市案例和
  每页十条分页均保留。
- `HallOfFame` 迁为 UFun scoped 的 Page2 feature：97 total、Approved、Q1/Median/Q3、
  默认折叠、按日期 ASC 的展开列表及每页十条分页均保留。
- 两份快照置于 UFun 既有 `json/` import convention，而不是 `data/`。第一次 build
  发现 Contentlayer 会将 `data/checkmate/*.json` 当作内容文档，因此在没有重算或修改
  数据的前提下移至 `json/checkmate/`。这避免数据进入博客内容管线。
- UFun 不包含 Checkee raw HTML、XLSX、H/I/J、学校、comments、联系方式、provenance、
  source IDs、parser、adapter 或任何 offline pipeline。
- Page1 和 Page2 文件与 Checkmate 源公开产物的 SHA-256 相同；计数分别为 503 与 97，
  PII 关键字扫描通过。

## Visual integration

- UFun `site-container` 提供外部 width 与 gutters，root layout 继续提供背景、Header、
  `main`、Footer、主题与排版。
- 新 CSS Module 是 feature scoped；没有导入 Checkmate `globals.css`，没有重置
  `html`、`body`、buttons 或 links，也没有增加 host page background token。
- 卡片沿用 UFun 当前 ambient background 中的半透明 surface、white border、30px 左右
  radius family、克制 shadow、backdrop blur、dark-mode surface 和 `--color-*` token。
- tab、按钮、hover、focus-visible 与 reduced motion 都在 module 内定义；图标复用 UFun
  已有 `lucide-react`，没有带入 Phosphor。
- 标题复用 UFun 既有 `public/fonts/HYBlackMythU.woff2` 和 `heishenhua` family；未复制
  字体资产或新增第二套 icon/font package。

## 浏览器 smoke test

- 默认 `/checkmate-preview` 真实挂载于 UFun Header、main、Footer 内；五城市、趋势和
  数据说明可见。
- `?ref=qa` 下选择北京后得到
  `?ref=qa&view=cities&city=beijing`；城市分页从 `1 / 19` 到 `2 / 19` 正常。
- 切换名人堂后 `ref=qa` 仍保留，`city` 会随 view 所有权清除；展开后分页从 `1 / 10`
  到 `2 / 10`，可见十条 case row。
- 1440×1000：标题、五城市、趋势和空详情区在宿主渐变背景与导航下自然排列。
- 390×844：白宫严选城市卡为两列加全宽第五项，标题宽度约 319px，document
  `scrollWidth` 375 小于 viewport 390；名人堂展开和分页可见且同样无横向溢出。
- 浏览器 `document.fonts.check('16px heishenhua')` 为 true。

## Validation

- 新增 UFun preview 文件通过 Prettier check 和针对新增文件的无修复 ESLint。
- 首次 `npm run typecheck` 和 production `npm run build` 均通过；该 build 的
  Contentlayer warning 促成 JSON 从 `data/checkmate` 移到 `json/checkmate`。
- 移动后最终 build/typecheck 是提交前 gate。一次重新执行请求因执行环境的授权传输
  错误被拒绝，未尝试绕过；应在允许写入 UFun ignored build cache 的环境中再运行。
- UFun 的 `npm run lint` 带 `--fix`，因会改动用户的既有工作树，未运行。

## 未来数据和视觉工作

生产数据更新始终先回 Checkmate repo 运行 offline schema/PII/data validation，再人工复制
新的安全 snapshot 到 UFun `json/checkmate/`；不得直接修改 UFun 内的统计值。本阶段没有
自动同步、watcher、网络 transfer、Checkee access 或部署。

Stage 3P 只需在 preview 之上微调 spacing、card composition、标题层级、dark-mode 对比和
responsive polish；不再重做路由、数据路径或 host/feature boundary。
