# 阶段 0：基础仓库与产品边界报告

日期：2026-08-22
范围：仅执行附件 Prompt 的“阶段 0”；未实现完整首页、真实数据导入、统计图表或任何后续阶段功能。

## 完成内容

- 从空目录初始化本地 Git 仓库，并建立 Next.js App Router + TypeScript + Tailwind CSS 基础骨架。
- 建立 `app/`、`components/`、`lib/data/`、`lib/analytics/`、`scripts/`、`data/private/`、`data/config/`、`data/generated/` 和 `docs/phase-reports/` 目录边界。
- 创建 `AGENTS.md`，明确目录职责、命令、TypeScript/组件约定、隐私红线、统计口径、禁止事项和完成定义。
- 创建 `README.md`、`docs/product-brief.md`、`docs/data-ethics-and-privacy.md`、`docs/terminology.md` 和 `docs/architecture.md`。
- 在 `.gitignore` 中排除 `data/private/**`、原始表格、临时导出、同步凭证、`.env*`（保留 `.env.example`）、测试下载物和分析缓存。
- 添加最小首页占位页和一个 smoke test；阶段 0 未读取附件中所述原始 Excel，工作区中没有导入任何私有源数据。
- 依赖版本按当前 registry 信息核验，并调整为兼容本机 Node.js 20.15.1 的组合；已生成 `package-lock.json`。

## 关键边界

- 产品是匿名众包数据解释工具，不是美国政府网站，不提供法律意见、不查询个人 CEAC 案件、不承诺出签日期。
- 原始 `Check` 只作为待处理默认语义；`Approved` 不自动等于 `Issued`；CEAC `Refused` 不自动等于最终拒签。
- pending age 与已完成处理时长必须在后续实现中保持不同字段、不同公式和不同文案。
- 首版不接入数据库、登录、用户追踪、CEAC 自动查询、网页抓取、Cookie/浏览器登录态同步或外部写操作。

## 验证结果

执行目录：`F:\projects_2027\checkmate`。

| 命令                                                                 | 结果 | 证据                                                   |
| -------------------------------------------------------------------- | ---- | ------------------------------------------------------ |
| `npm install`                                                        | PASS | 依赖安装完成，生成 lockfile                            |
| `npm run format:check`                                               | PASS | All matched files use Prettier code style              |
| `npm run lint`                                                       | PASS | ESLint 无错误                                          |
| `npm run typecheck`                                                  | PASS | `tsc --noEmit` 无错误                                  |
| `npm test`                                                           | PASS | 1 个测试文件、1 个测试通过                             |
| `npm run build`                                                      | PASS | Next.js 16.3.2 静态构建成功，`/` 与 `/_not-found` 生成 |
| `npm audit --registry=https://registry.npmjs.org --audit-level=high` | PASS | found 0 vulnerabilities                                |

最初使用的镜像 registry 不支持 audit endpoint，返回 404；改用 npm 官方 registry 后审计通过。没有因为这个问题跳过审计。

## 已知风险与限制

- 本机 Node.js 为 20.15.1；工程依赖已选择与该运行时兼容的版本。后续升级依赖必须重新核验 engine、peer dependency 和安全公告。
- 当前没有真实数据文件，因此尚未验证 Excel 表头漂移、PII 命中、状态冲突和真实样本基线；这些属于阶段 1 的输入与验收范围。
- 当前页面仅为工程占位页，未选择视觉方向，也未实现业务数据可视化。
- 依赖审计只反映本次 lockfile 和官方 registry 的结果，更新依赖或数据处理脚本后必须重新执行。

## 下一阶段输入

阶段 1 需要在本地私有目录提供 `data/private/f1-visa-check-source.xlsx`，建立只在 Node/脚本侧运行的导入、审计、规范化、公开模型、Zod schema、PII 扫描和公开 JSON 生成流程。不得把原始 Excel 或内部自由文本加入 Git、`public/`、构建产物、日志或测试快照。
