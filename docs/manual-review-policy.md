# 人工审核策略

> 状态：`superseded`。新版不再使用本站人工审核或本地投稿流程；请以 [`data/checkee-source-contract.md`](data/checkee-source-contract.md) 和 [`data/checkee-data-dictionary.md`](data/checkee-data-dictionary.md) 为准。本文件保留阶段 1 的历史决策，不作为 Checkee 数据处理授权或当前公开字段契约。

## 审核目的

人工审核用于检查格式、逻辑、重复和隐私，决定一条记录是否可以进入 Demo。审核不代表美国政府认证、案件真实性保证或法律意见。

## 内部审核状态

| 状态                   | 含义                           | 是否进入公开统计/列表 |
| ---------------------- | ------------------------------ | --------------------- |
| `draft`                | 尚未完成整理                   | 否                    |
| `needs_review`         | 存在待核对字段、冲突或隐私风险 | 否                    |
| `verified_for_publish` | 已完成必要审核并清洗公开字段   | 是                    |
| `rejected_private`     | 无法安全公开或不符合项目范围   | 否                    |

`reviewStatus`、`reviewedAt`、审核人员信息和完整审核备注只存在私有内部记录，不进入前端或公开 JSON。

## 审核顺序

1. 范围：确认是中国大陆申请地点的 F-1 案例，不混入 J-1、H-1B、B1/B2 或 OPT EAD。
2. 格式：确认地点、学位、专业、日期和状态可以映射到规范字段。
3. 逻辑：确认日期顺序、状态和 Case Update/备注之间没有未解释冲突。
4. 重复：检查同一案例或重复提交候选；不以普通完整行哈希作为公开 ID。
5. 隐私：移除邮箱、手机号、微信/QQ、护照号、SEVIS ID、DS-160、CEAC Case Number、姓名及其他身份标识。
6. 公开字段：按 [`public-field-policy.md`](public-field-policy.md) 逐字段确认可公开范围。
7. 决策：只有无阻断问题的记录才标记 `verified_for_publish`；否则保留 `needs_review` 或 `rejected_private`。

## 状态语义

- `Check` 默认表示当前仍在等待的 pending 样本，不表示最终结果。
- `Approve` 可以作为来源状态展示，但不得自动改写为 `Issued`。
- Case Update 中出现 `refused` 时，不能自动判定最终拒签；应标记待人工复核，并保留 221(g)/CEAC 语义不确定性。
- pending age 是当前观察日的等待年龄，不得写成已完成处理时长。

## 更新与删除

后续收集入口必须允许提交者请求更正或删除记录，但不能要求在公开数据中留下邮箱、微信或案件号。请求处理结果只记录在私有审核台账中；本阶段只定义政策，不实现收集表单或外部同步。
