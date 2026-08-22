# F-1 Visa Check 数据看板

这是一个面向 F-1 签证行政审查（社区常称 Check / AP）经历者，以及需要安排申请时间的学生的匿名众包数据说明项目。它帮助用户理解当前样本分布、寻找相似样本并看清数据边界。

本项目不是美国政府官方网站，不提供法律意见，不查询个人 CEAC 案件，不承诺出签日期，也不把众包样本包装成总体概率。公开内容只使用经过隐私清洗和质量校验的宽泛字段。

## 当前状态

阶段 0：已建立 Next.js App Router + TypeScript + Tailwind 工程骨架、产品边界、隐私约束和测试链路。完整数据管线与看板尚未实现；当前首页只是项目占位页。

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

## 数据更新（占位）

原始 Excel 未来只能放在本地 `data/private/f1-visa-check-source.xlsx`，该目录已被 `.gitignore` 排除。阶段 1 将建立仅在脚本侧运行的导入、审计、规范化、PII 扫描和公开 JSON 生成流程；阶段 0 不读取或生成业务数据。

## 隐私原则

- 不提交原始 Excel、自由文本、学校、Case Update、备注、联系方式或源表行号。
- 不收集姓名、护照号、DS-160、SEVIS ID、Case Number、邮箱、微信号或 QQ。
- 公开统计始终展示样本量和限制；pending 等待天数与已完成时长严格分开。

更多约束见 [`AGENTS.md`](AGENTS.md) 和 `docs/` 下的项目文档。
