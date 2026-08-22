# 阶段 3B：离线数据基础、静态快照与来源解耦

日期：2026-08-22

## 目标

页面、统计和数据获取分成三层：来源 Adapter 只负责输入转换；归一化层负责字段、别名、日期和质量规则；PublicSnapshot 负责安全公开字段、统计、cohort 和页面消费。Checkee 的 HTML 不是产品模型的一部分。

```text
DemoFixtureAdapter          ┐
CheckeeExportAdapter        ├─> NormalizedCase -> PublicSnapshot -> EvidenceAtlas
ManualCheckeeHtmlAdapter    ┘    （只读本地手工 HTML，非实时）
CheckeeHtmlAdapter*              未来授权后的生产入口，当前 disabled
```

## 公开模型

- `NormalizedCase`：内部处理模型，包含质量标记和排除原因；不进入页面。
- `PublicCase`：只包含 F-1、地点、入口、专业宽类、状态、日期和计算时长。
- `DatasetManifest`：来源、权限状态、范围、快照日期、版本、数量和内容 hash。
- `DataQualityReport`：候选数、纳入/排除、异常旗标、重复、月份冲突、等待日冲突、隔离数和敏感字段扫描。

## 规则

- F-1 仅接受 `f1`、`f-1`、`f 1`；地点仅接受北京、上海、广州、沈阳、武汉及代码内显式别名。
- 状态只接受 Pending、Clear、Reject；未知状态、未知地点、非 F-1、非法日期和无法判断的日期顺序不进入公开快照。
- Pending age 在静态 HTML 中优先使用来源页面的 `Waiting Day(s)`，并记录 `source_waiting_days`；没有可信来源等待日时才使用 `snapshotDate - checkDate`。Clear duration 使用 `completeDate - checkDate`；Reject 不参与完成时长。
- `sourceMonth` 与日期不一致、来源 waiting days 与日期推导不一致时保留记录但标记质量问题。
- 地点样本量 `<5` 标记 `insufficient` 并在地点页隐藏等待/完成时长分位数；`5–9` 标记 `small`，只作描述性参考；`≥10` 标记 `standard`。统计函数始终返回分母和 `sampleBand`。
- 当前月份在 manifest/cohort 中标记 `partial`，不得与完整月份直接比较。

## 适配器与访问状态

`ManualCheckeeHtmlAdapter` 是当前默认页面快照的导入入口，只接受本地 `2601.html` 至 `2608.html`；`DemoFixtureAdapter` 是显式回退；`CheckeeExportAdapter` 接受开发者提供的 CSV/JSON；`CheckeeHtmlAdapter` 仍只执行 fail-closed 检查并抛出明确错误。默认设置为：

```text
CHECKEE_ACCESS_MODE=disabled
```

构建、测试、CI 和页面均不请求 Checkee。真实抓取命令 `npm run data:checkee:fetch` 会直接退出；不得使用 Cookie、代理、缓存拼接或旧爬虫字段猜测绕过这一边界。

## 数据来源说明

当前页面默认使用 2026-01 至 2026-08 的手工保存 HTML 静态快照；`manifest.sourceMode=manual-html-static`、`isLive=false`、`accessStatus=CHECKEE_ACCESS_BLOCKED`。快照不是实时数据，不代表 Checkee 真实总体、官方处理速度或个案预测。获得授权后，适配器应输出同一 `NormalizedCase`，不需要改写页面或统计层。`DEMO_DATA` 仅在显式设置 `NEXT_PUBLIC_DATASET_MODE=demo-fixture` 时使用。
