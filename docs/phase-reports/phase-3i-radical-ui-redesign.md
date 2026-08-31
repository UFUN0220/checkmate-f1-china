# Stage 3I：Radical UI Redesign

## 阶段状态

- 基线：`30d7e76 feat: redesign stage 3h production snapshot interface`
- 本阶段范围：只重做 presentation layer；数据、统计、解析和安全边界保持冻结。
- 当前快照仍为 `2026-09-01 00:00`，公开静态样本仍为 503 条。
- 授权状态仍为 `CHECKEE_ACCESS_BLOCKED`；没有执行真实网络抓取。

## 为什么放弃 Stage 3H 的界面方向

Stage 3H 的四个独立 view 和纵向 section 组织虽然清晰，但城市首页仍然偏“后台”：导航和页面标题占用较多垂直空间，趋势需要单独切换，城市卡片与案例列表之间留白偏多，核心数据没有在同一工作区形成内容节奏。

Stage 3I 改为单页高密度的信息工作区：城市等待合并月度趋势，Peer 和 Hall 保持独立；城市详情仍通过 URL 下钻，但改为 10 条分页的紧凑案例行。

## 设计调研与复用边界

博客项目确认为 `F:\projects_2027\ufunx\ufunx`，通过 `app/blog`、博客卡片和列表布局检查了实际实现。复用点为：

- `#f5f5f7` 浅灰页面底色；
- 白色圆角内容卡与轻阴影；
- 内容层与背景层的轻微错位关系；
- 图片/信息卡片式布局和更紧凑的列表节奏。

没有复制博客内容，也没有引入博客的外部网络字体、分析或业务逻辑。没有把 UFunx 的 Bento、复杂渐变或装饰性背景搬入 Checkmate。

## 汉仪黑神话字体

在 `F:\projects_2027\ufunx\ufunx\css\homefont.css` 和 `public/fonts/HYBlackMythU.woff2` 中确认了实际 `font-face` 接入方式。已将该字体复制到 Checkmate 的 `public/fonts/HYBlackMythU.woff2`，并只用于主标题 `2026年度白宫严选中国F1硕博`；正文、数据和导航继续使用系统字体。

## 新信息架构

顶部导航从四个入口收敛为三个：

1. `城市等待`：主标题、五城 Q1/Median/Q3、月度 F-1 趋势和城市详情入口/列表。
2. `同学样本`：独立匿名样本、Q1/Median/Q3 和紧凑案例行，当前持续标记 `DEMO DATA`。
3. `Check 名人堂`：独立 mock Top 3 与 #4–10 紧凑列表，当前持续标记 `DEMO DATA`。

旧的 `?view=trend` 不再对应独立页面，读取时回落到城市等待；有效 view 只有 `cities | peers | hall`。`?city=`、前进/后退和 `popstate` 状态恢复继续保留。

## 城市页与趋势合并

城市页采用单一首屏工作区：上方为主标题和五个内容卡，下方左右并列月度趋势卡与当前城市详情/选择入口。趋势仍然只统计 F-1、按 Check Date 归属月份、Reject 排除，Jan–Aug 总结仍使用所有有效等待天数的加权总平均，不修改 3H 的统计实现。

## 地区详情排序与分页

- 新增 `sortByCheckDateDescending`，地区案例按 `Check Date DESC`，最新开始时间在最上方。
- 页面每次最多渲染 10 条案例，新增上一页/下一页控件和页码状态。
- 切换城市时页码回到第 1 页；当前页数量、总页数和 URL 城市状态保持可读。
- 案例行优先显示状态、开始/结束日期、等待天数，再显示地点和专业/学位等次要信息。

## 文案、密度与响应式

- 仅保留主标题为强识别大字，其他标题和说明明显收紧。
- 参考博客的内容卡节奏，但保持 Checkmate 的数据语义、状态颜色和公开数据提示。
- 1440×1000 桌面验收显示城市主标题、五城卡片、月度趋势和城市入口均在核心首屏内。
- 390×844 验收无横向溢出；趋势表在移动端转为两列信息块，城市卡片使用两列布局。
- 导航使用真实链接与 `aria-current`，城市卡保留 `aria-pressed`，分页按钮有可读 aria-label，继续支持键盘 focus 和 reduced-motion。

## 验证结果

已通过：

- `npm test`：9 个测试文件，47 个测试通过；
- `npm run lint`；
- `npm run typecheck`；
- `npm run format:check`；
- `npm run data:checkee:validate`；
- `npm run data:manual:validate`；
- `npm run check:offline`；
- `npm run build`；
- `npm run data:checkee:fetch`：按预期以退出码 1 拒绝，明确输出 `CHECKEE_ACCESS_MODE=disabled`，未访问网络。

浏览器验收：

- 1440×1000：城市页、Peer、Hall 可加载；城市详情渲染 10 条并支持分页；
- 390×844：页面 `body.scrollWidth` 未超过 viewport，无横向滚动；
- Peer/Hall 保留 `DEMO DATA`；
- `?view=trend` 回落到合并后的城市页。

## 已知限制

- 本阶段没有重新抓取 Checkee，也没有修改 parser、provenance、offline guard、manual contract 或公开数据产物。
- 当前城市页是非实时静态快照；Peer/Hall 仍是独立开发 mock，不能宣传为真实 Checkee 数据。
- 浏览器首屏验收依赖本地 dev server；紧凑的方法说明和 footer 允许继续位于核心内容之后，不影响核心工作区读取。
- 未 push、未部署生产；历史阶段的未相关修改、`.idea` 和既有截图没有纳入本阶段提交。
