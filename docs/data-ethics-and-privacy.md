# 数据伦理与隐私约束

## 数据最小化

当前 Demo 允许在人工审核和敏感信息清洗后公开学校、精确面签日期、Case Update 和备注；但原始自由文本、联系方式、案件标识、审核人员信息和源表行号永不进入公开产物。具体字段以 [`public-field-policy.md`](public-field-policy.md) 为准。

原始 Excel 只允许本地放在 `data/private/`，该目录和原始表格扩展名已加入 `.gitignore`。阶段 1 会增加构建前和生成后的 PII 扫描；扫描命中即阻断构建。

## 风险与缓解

- 众包选择偏差：所有公开结论标注样本量和众包限制，不称为总体概率。
- 小样本误读：`n < 5` 不输出分组数值结论，`5–9` 标记样本较少。
- 重识别风险：当前 Demo 虽允许精确日期和学校，但每条记录仍须人工审核，清除身份片段并检查稀有组合；匿名 ID 不由邮箱、学校、备注或完整原始行的普通哈希生成。
- 状态误读：CEAC `Refused` 在部分 221(g) 行政审查场景中可能只是过程状态，不自动等同最终拒签；`Approved` 不等同 `Issued`。
- 等待时间误读：pending age 是截至某个 `asOfDate` 的当前等待年龄，不是已完成处理时长。

## 禁止收集

产品不要求姓名、护照号、DS-160、SEVIS ID、CEAC Case Number、学校邮箱、微信号、QQ 或上传自由文本。阶段 0 不接入登录、数据库、外部同步或分析追踪。

## 官方语义来源

- [Administrative Processing Information — U.S. Department of State](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/administrative-processing-information.html)
- [CEAC Case Status Change — U.S. Department of State](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/visas-news-archive/visas-ceac-case-status-change.html)
