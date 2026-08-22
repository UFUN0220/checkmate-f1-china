# F-1 Visa Check 数据看板

这是一个面向 F-1 签证行政审查（社区常称 Check / AP）经历者，以及需要安排申请时间的学生的匿名众包数据说明项目。它帮助用户理解当前样本分布、寻找相似样本并看清数据边界。

本项目不是美国政府官方网站，不提供法律意见，不查询个人 CEAC 案件，不承诺出签日期，也不把众包样本包装成总体概率。公开内容只使用经过隐私清洗和质量校验的宽泛字段。

## 当前状态

阶段 3B：手工 HTML 静态快照接入与临时 Demo 已完成。默认页面读取 8 个本地保存的 Checkee 月份 HTML（2026-01 至 2026-08），经过 DOM 解析、归一化、质量门禁后生成 475 条公开静态案例。页面明确标记为 `STATIC SNAPSHOT`，不是实时数据，也不代表 Checkee 官方或总体样本。`DEMO_DATA` 仍可作为显式离线回退。

Checkee 当前记录为 `CHECKEE_ACCESS_BLOCKED`，默认 `CHECKEE_ACCESS_MODE=disabled`。静态导入只接受本地文件路径，不接受 URL、Cookie 或网络请求；没有真实抓取器、定时任务或线上数据请求。未来只需把 CSV/JSON 或经授权的 HTML 接入 `CaseSourceAdapter`，统计和页面继续消费同一个 `PublicSnapshot`。

## 本地运行

```bash
npm install
npm run dev
```

数据模式可用环境变量显式切换：

```text
DATASET_MODE=checkee-static
NEXT_PUBLIC_DATASET_MODE=checkee-static
```

重新解析本地 `dataset_260823/`（目录只在本机存在）可运行：

```bash
npm run data:checkee:inspect
npm run data:checkee:import-static
npm run data:checkee:validate
```

然后打开 `http://localhost:3000`。提交前运行：

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npm run audit
```

## 数据边界与离线验证

运行 `npm run check:offline` 会执行格式检查、Lint、TypeScript、单元测试和生产构建；这些步骤不访问 Checkee。运行 `npm run data:checkee:fetch` 会明确退出并说明当前访问模式被禁用，避免误把开发环境当成真实同步环境。

来源契约、最小公开字段、静态 HTML 结构、适配器边界和阶段记录见 [`docs/data/checkee-source-contract.md`](docs/data/checkee-source-contract.md)、[`docs/data/checkee-static-html-contract.md`](docs/data/checkee-static-html-contract.md)、[`docs/data/offline-data-architecture.md`](docs/data/offline-data-architecture.md) 与 [`docs/phase-reports/phase-3b-static-html-demo.md`](docs/phase-reports/phase-3b-static-html-demo.md)。

## 隐私原则

- 不提交 Checkee 原始 HTML、Comments/Details、联系方式、来源记录 ID、身份字段或内部 key。
- 公开产物只允许使用 [`docs/data/checkee-data-dictionary.md`](docs/data/checkee-data-dictionary.md) 定义的最小字段。
- 不收集姓名、护照号、DS-160、SEVIS ID、Case Number、邮箱、微信号或 QQ。
- 公开统计始终展示样本量和限制；pending 等待天数与已完成时长严格分开。

更多约束见 [`AGENTS.md`](AGENTS.md) 和 `docs/` 下的项目文档。
