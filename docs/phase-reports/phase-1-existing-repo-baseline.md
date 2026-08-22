# 阶段 1：现有仓库基线复验与 Demo 需求落盘

日期：2026-08-22
范围：只执行当前阶段 1 Prompt；未实现完整页面、数据库、数据导入或腾讯文档 API。

## 基线

- Repository：`https://github.com/UFUN0220/checkmate-f1-china.git`
- Branch：`main`
- 阶段开始 HEAD：`dda977f6faa73f1fcf02eb33c55a6227359b1323`
- origin：与 Prompt 要求一致
- 阶段开始工作区：无已跟踪修改；有用户提供的未跟踪阶段 Prompt 文件。
- 技术栈：Next.js 16.3.2、React 19.2.8、TypeScript 5.9.3、Tailwind CSS 4.3.3、Vitest 3.2.7。
- 当前产品结构：全国样本概览 → 地点指标 → 人工审核案例记录。

## 本阶段落盘内容

- 更新 `docs/product-brief.md`：将产品明确为 CheckMate F1 China Demo，锁定中国大陆 F-1 Check、80 条样本基线和三级目标。
- 新增 `docs/demo-scope.md`：定义全国、地点、案例三级范围，地点样本分布、指标边界和不在本阶段实现的内容。
- 新增 `docs/information-architecture.md`：定义下钻、返回路径、桌面/390px 移动端行为和 URL 查询状态。
- 新增 `docs/manual-review-policy.md`：定义审核状态、格式/逻辑/重复/隐私审核顺序和 CEAC/221(g) 状态规则。
- 新增 `docs/public-field-policy.md`：明确学校、精确面签日期、Case Update 和备注可在人工清洗后公开；联系方式、案件标识、身份字段、源表行号和审核人员信息禁止公开。
- 更新 `AGENTS.md`、`README.md`、`docs/data-ethics-and-privacy.md`、`docs/architecture.md`，使稳定工程规则与当前 Demo 范围一致。

## 基线命令结果（修改前）

| 命令                | 结果 | 证据                                            |
| ------------------- | ---- | ----------------------------------------------- |
| `npm install`       | PASS | up to date                                      |
| `npm run lint`      | PASS | ESLint 无错误                                   |
| `npm run typecheck` | PASS | `tsc --noEmit` 无错误                           |
| `npm test`          | PASS | 1 个测试文件、1 个测试通过                      |
| `npm run build`     | PASS | Next.js 静态构建成功，`/` 与 `/_not-found` 生成 |

## 隔离与安全复核

- `.gitignore` 已覆盖 `data/private/**`、原始 `xlsx/xls/csv/tsv`、`.env*`（保留 `.env.example`）、临时导出、测试下载物和本地缓存。
- `data/private/` 目录存在且为空；当前没有原始数据被 Git 跟踪。
- 用户提供的原始 Excel 当前位于 `docs/` 下，物理位置不符合“原始数据只能放在 `data/private/`”的约定；它因 `*.xlsx` 规则被忽略，没有进入 Git。根据“不自行清理或覆盖用户现有修改”的约束，本阶段未移动或删除该文件，后续数据阶段开始前应由用户/数据维护流程将其放入 `data/private/`。
- 当前 Prompt 文件也是用户提供的未跟踪文件，本地保留但未纳入本阶段 commit。
- 未接入数据库、登录、用户追踪、腾讯文档 API、网页抓取、Cookie 或浏览器登录态同步。

## 已知限制与下一阶段输入

- 当前仍只有占位首页，没有实现三级页面、筛选、图表或案例列表。
- 公开学校、精确日期、Case Update 和备注的实际清洗、schema、重复判断和 PII 扫描需要在后续数据阶段实现；本阶段只落盘政策，不生成公开数据。
- 本阶段没有修改远程仓库，没有 push 或部署。
- 下一阶段应复用本阶段的 `demo-scope.md`、`information-architecture.md`、`manual-review-policy.md` 和 `public-field-policy.md`，先设计三套可比较的视觉方向，再等待选择，不直接进入生产页面实现。
