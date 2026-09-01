# 阶段 3K：产品命名与 Page2 等分位数报告

日期：2026-09-01  
基线：`f9ab02d feat: integrate stage 3j page2 dataset`  
状态：完成（本地、离线、未推送）

## 产品命名与导航

- Page1 正式命名为“白宫严选”，继续对应 Checkee F-1 公开静态数据。
- Page2 正式命名为“名人堂”，继续对应 `page2.xlsx` 静态数据。
- 顶部导航仅保留“白宫严选”和“名人堂”。
- 稳定内部 URL 不变：`view=cities` 对应白宫严选，`view=peers` 对应名人堂。
- `view=hall` 继续规范化到名人堂；`view=trend` 继续回退到白宫严选。
- Page2 内部不再重复显示“名人堂”，案例区改为“案例 / 展开案例”。

## 页面精简

- 删除 Page2 的工程化 `PAGE2 STATIC`、`真实静态数据` 等重复标签，换成“匿名样本”和自然的截止日期说明。
- Page2 默认只显示“核心统计”与两组紧凑信息：案例/Approve，以及 Waiting distribution。
- Page1 保留五城、月度趋势、城市下钻和分页；城市案例卡移除已由当前城市上下文重复表达的地点字段。
- 统一保留一个折叠的数据说明和 footer disclaimer：公开样本统计，仅供参考，不代表官方处理时间或个人结果。
- 不再向生产页面暴露旧的 Peer Sample、Check 名人堂、Top 3、Gold/Silver/Bronze 等旧产品语义。

## Page2 等分位数

Page2 继续使用 Stage 3J 生成的标准化 `Page2Case.waitingDays`，不从 Excel 在展示层重新计算。等分位数复用统一的 `calculateWaitStats()` 百分位定义；未来如有无效等待值，只把有效值计入 stats sample size，案例总数仍单独保留。

当前 Page2 统计结果：

| 指标                      |      值 |
| ------------------------- | ------: |
| Total cases               |      97 |
| Approved                  |      11 |
| Waiting stats sample      |      97 |
| Q1                        |   54 天 |
| Median                    |   75 天 |
| Q3                        |   89 天 |
| Average waiting（仅审计） | 73.2 天 |

UI 不再主展示 Average Waiting；Median 居中且字号略大，Q1/Q3 位于两侧。案例仍默认折叠，展开后按面签日期升序，每页最多 10 条。

## 隐私与数据边界

H/I/J 继续在 normalization 阶段完成非空值合并审计，但公开 `mergedInfo` 仍为 `null`。学校、备注、联系方式、raw text、source row 和 workbook 数据没有恢复到前端。Page2 管线仍为：`page2.xlsx → parser → normalization → safe static JSON → frontend`。

Page1 的 Checkee parser、F-1 过滤、地点映射、城市 Q1/Median/Q3、月度趋势、snapshot 和城市 Check Date DESC 分页逻辑均未改变。Page1 仍为 503 条公开案例，Checkee 网络访问保持 disabled / fail closed。

## 验证

- `npm test`：通过，包含 Page1 regression、Page2 命名/路由/展示、Page2 quartile fixture。
- `npm run lint`：通过。
- `npm run typecheck`：通过。
- `npm run data:checkee:validate`：通过。
- `npm run data:page2:validate`：通过，97 条、快照日 `2026-09-01`。
- `npm run build`：通过。
- Stage 3K 修改文件单独 Prettier check：通过。
- `CHECKEE_ACCESS_MODE=disabled` 真实抓取继续明确退出，未访问 Checkee。

已知限制保持不变：全局 format check 仍会被阶段之前未提交的 `pnpm-lock.yaml` 阻塞；`data:manual:validate` 仍因环境缺少既有脚本所需的 `esbuild` 无法运行。没有为本阶段进行无关 lockfile 或依赖 churn。

## 本阶段提交

建议 commit：`feat: finalize stage 3k product metrics`
