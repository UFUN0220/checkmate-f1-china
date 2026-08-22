# F-1 Visa Check 数据看板

这是一个面向 F-1 签证行政审查（社区常称 Check / AP）经历者，以及需要安排申请时间的学生的匿名众包数据说明项目。它帮助用户理解当前样本分布、寻找相似样本并看清数据边界。

本项目不是美国政府官方网站，不提供法律意见，不查询个人 CEAC 案件，不承诺出签日期，也不把众包样本包装成总体概率。公开内容只使用经过隐私清洗和质量校验的宽泛字段。

## 当前状态

阶段 3：已完成新版需求迁移和 Checkee 来源边界验证。Checkee 首页与 `robots.txt` 可读取，但 `2026-01` 与当前 `2026-08` 月份页返回 HTTP 403；项目已按 fail-closed 规则停止来源结构解析，不使用旧 Excel 或旧 80 条基线生成数据。

## 本地运行

```bash
npm install
npm run dev
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

## 数据更新（阶段 3 暂停）

唯一计划来源为 Checkee.info 自 2026-01-01 起的公开页面。当前月份页访问被 403 阻断，因此没有生产抓取器、线上数据快照或前端实时请求；后续必须先获得合规可访问的来源页面，再按 [`docs/data/checkee-source-contract.md`](docs/data/checkee-source-contract.md) 实现阶段 4。

## 隐私原则

- 不提交 Checkee 原始 HTML、Comments/Details、联系方式、来源记录 ID、身份字段或内部 key。
- 公开产物只允许使用 [`docs/data/checkee-data-dictionary.md`](docs/data/checkee-data-dictionary.md) 定义的最小字段。
- 不收集姓名、护照号、DS-160、SEVIS ID、Case Number、邮箱、微信号或 QQ。
- 公开统计始终展示样本量和限制；pending 等待天数与已完成时长严格分开。

更多约束见 [`AGENTS.md`](AGENTS.md) 和 `docs/` 下的项目文档。
