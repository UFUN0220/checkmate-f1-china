# 术语与状态语义

本页区分社区用语、系统显示和最终业务结论。任何前端文案都必须遵循这里的保守解释。

| 术语         | 项目中的解释                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Check / AP   | 社区常用说法，通常指签证申请进入 Administrative Processing；不是项目内部的最终结果。                                      |
| 221(g)       | 美国签证流程中可能触发行政审查或补充处理的法律/程序依据；不能仅凭一个词推断最终结果。                                     |
| CEAC Refused | CEAC 页面可能显示的状态。在部分 221(g) 行政审查场景中，`Refused` 不等于案件永久结束或最终拒签；需结合官方说明和后续更新。 |
| Approved     | 来源记录中的积极状态；项目不会自动把它解释为 `Issued`。                                                                   |
| Issued       | 签证已签发的明确状态。只有数据中有可信、结构化证据时才可使用。                                                            |
| 最终拒签     | 需要明确且经人工确认的最终负面结果；不能由 Case Update 中孤立出现的 `refused` 自动推断。                                  |

官方语义以美国国务院页面为准：

- [Administrative Processing Information](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/administrative-processing-information.html)
- [CEAC Case Status Change](https://travel.state.gov/content/travel/en-us/visas/visa-information-resources/visas-news-archive/visas-ceac-case-status-change.html)

如果官方页面、原始记录与社区用语冲突，产品保留不确定性，优先显示“待人工复核”或解释性不可用状态，不做确定性猜测。
