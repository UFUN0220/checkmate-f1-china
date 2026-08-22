# F-1 Visa Check 数据看板

这是一个面向 F-1 签证行政审查（社区常称 Check / AP）经历者，以及需要安排申请时间的学生的匿名众包数据说明项目。它帮助用户理解当前样本分布、寻找相似样本并看清数据边界。

本项目不是美国政府官方网站，不提供法律意见，不查询个人 CEAC 案件，不承诺出签日期，也不把众包样本包装成总体概率。公开内容只使用经过隐私清洗和质量校验的宽泛字段。

## 当前状态

阶段 1：已完成现有仓库基线复验，并将 Demo 优先、三级下钻、人工审核和公开字段边界落到文档。完整页面、数据层和看板交互尚未实现；当前首页仍是项目占位页。

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

原始 Excel 只能放在本地 `data/private/`，该目录和原始表格扩展名已被 `.gitignore` 排除。后续数据层必须先经过人工审核、敏感信息清洗和公开字段策略门禁；本阶段不实现导入或公开 JSON 生成。

## 隐私原则

- 不提交原始 Excel、未审核自由文本、联系方式、案件标识、审核人员信息或源表行号。
- 学校、精确面签日期、Case Update 和备注只有在人工审核清洗后才允许进入公开产物。
- 不收集姓名、护照号、DS-160、SEVIS ID、Case Number、邮箱、微信号或 QQ。
- 公开统计始终展示样本量和限制；pending 等待天数与已完成时长严格分开。

更多约束见 [`AGENTS.md`](AGENTS.md) 和 `docs/` 下的项目文档。
