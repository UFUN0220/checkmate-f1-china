# 阶段 3A：离线数据基础、统计引擎与前端解耦

日期：2026-08-22
状态：`DEMO_READY / CHECKEE_ACCESS_BLOCKED`

## 完成内容

- 建立 `NormalizedCase`、`PublicCase`、`DatasetManifest`、`DataQualityReport` 和 `PublicSnapshot`。
- 建立 F-1、地点、入口和状态的显式 alias 白名单，并统一 Pending age、Clear duration、月份冲突、等待天数冲突、日期异常和小样本规则；统计输出 `sampleBand`，地点页对 `<5` 样本隐藏时长分位数。
- 建立 `DemoFixtureAdapter`、`CheckeeExportAdapter` 和 fail-closed 的 `CheckeeHtmlAdapter`。
- 生成 42 条合成候选记录，输出 36 条公开案例：Pending 18、Clear 14、Reject 4；覆盖北京、上海、广州、沈阳、武汉。
- 完成样本构成、地点分布、Pending 中位数/P75/最大值、Clear 中位数/P75、月度 cohort、重复记录和全国/地点/案例对账。
- 页面改为消费同一个 demo `PublicSnapshot`，支持全国概览、地点下钻、标准化案例列表、状态/月份/入口/专业 URL 筛选，以及移动端布局。
- 添加来源状态 banner、方法说明、`DEMO_DATA` 标记、空结果状态、当前月 incomplete 标记和离线 CI。

## 质量结果

合成数据故意包含 6 条排除候选，覆盖非 F-1、未知地点、未来日期、未知状态、日期顺序异常和重复 source key。公开案例只保留安全字段；敏感字段扫描和全国/地点对账必须通过。

## 验证

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

CI 设置 `CHECKEE_ACCESS_MODE=disabled`，不访问 Checkee。真实同步命令也会明确退出，直到得到明确授权和合规输入。

## 限制与下一输入

当前数字全部是合成开发数据，不能用于描述 Checkee 真实分布或预测个人结果。下一步只需获得开发者提供的 CSV/JSON、正式 API 或明确 HTML 访问授权，并实现相应 Adapter；页面、统计和公开字段边界无需推倒重来。
