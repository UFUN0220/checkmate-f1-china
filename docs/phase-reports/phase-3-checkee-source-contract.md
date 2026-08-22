# 阶段 3：Checkee 来源验证与抓取契约报告

日期：2026-08-22  
范围：新版总需求文档阶段 3。只完成需求迁移、来源边界验证、字段契约和 fail-closed fixtures；未实现生产抓取器、全量抓取、解析器、公开数据快照或页面数据替换。

## 1. 仓库基线

- Repository：`https://github.com/UFUN0220/checkmate-f1-china.git`
- Branch：`main`
- 阶段开始 HEAD：`ff97855 docs: establish phase 1 demo baseline`
- origin：与新版需求一致。
- 阶段开始工作区：已有上一阶段未提交的视觉实现、截图和用户提供 Prompt 文件；本阶段未覆盖或清理这些修改。
- 技术栈：Next.js 16.3.2、React 19.2.8、TypeScript 5.9.3、Vitest 3.2.7。

## 2. 新版范围迁移

已将以下规则写入当前仓库：

- 唯一来源改为 Checkee.info 公开页面。
- 时间范围从 `checkDate >= 2026-01-01` 开始。
- 只保留显式确认的 F-1 alias 和北京、上海、广州、沈阳、武汉五地。
- 旧 Excel、80 条旧基线、人工审核、本地投稿/更新、PIVIB、CEAC 和其他来源标记为废止或 superseded。
- 公开案例改用 Checkee F-1 标准化案例语义，不公开 Comments、Details、来源记录 ID、身份字段或自由文本。
- Pending age 与 Clear resolved duration 的字段和公式已经写入新版数据字典。

## 3. 来源验证

验证日期：2026-08-22。使用项目可识别 User-Agent：
`CheckMate-F1-China/0.1 (+https://github.com/UFUN0220/checkmate-f1-china)`。

| 页面                                                 | HTTP | 结果                                                                                                                                 |
| ---------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `https://www.checkee.info/robots.txt`                | 200  | 读取到 Cloudflare Managed content 规则；`User-agent: *` 同时存在允许/Content-Signal 与后续 `Disallow: /`，按保守规则不授权自动抓取。 |
| `https://www.checkee.info/`                          | 200  | 首页公开可达，存在月份导航、捐赠、`report_case.php` 和 CEAC 外链；未发现独立 Terms/Privacy 链接。                                    |
| `https://www.checkee.info/main.php?dispdate=2026-01` | 403  | 月份页面正文不可读取；立即停止。                                                                                                     |
| `https://www.checkee.info/main.php?dispdate=2026-08` | 403  | 月份页面正文不可读取；立即停止。                                                                                                     |

来源参考：[`Checkee robots.txt`](https://www.checkee.info/robots.txt)、[`Checkee homepage`](https://www.checkee.info/)。

### 结论

阶段 3 的来源验证被访问边界阻断。当前不能据实确认月份页列名、F-1 写法、地点写法、状态枚举、日期格式、空值、分页或结构异常；不能根据旧爬虫、搜索摘要或旧 Excel 补出这些事实。

因此本阶段：

- 不实现生产抓取器。
- 不重试 403，不绕过访问控制，不使用代理池、轮换 User-Agent 或浏览器登录态。
- 不访问 `report_case.php`、`personal_detail.php` 或 CEAC 个人/案件页面。
- 不生成任何新的 Checkee 数字或公开数据快照。
- 用两个最小 403 脱敏片段测试 fail-closed 行为；它们不是成功解析 fixture。

## 4. 产物

- [`docs/product-rationale.md`](../product-rationale.md)：新版动机、痛点、定位、唯一来源和 30 秒回答目标。
- [`docs/data/checkee-source-contract.md`](../data/checkee-source-contract.md)：来源范围、robots/403 结果、访问边界、缓存/限速/失败策略和恢复后的待确认契约。
- [`docs/data/checkee-data-dictionary.md`](../data/checkee-data-dictionary.md)：raw → normalized → public 字段、日期公式和排除规则。
- [`scripts/fixtures/checkee/README.md`](../../scripts/fixtures/checkee/README.md)：阻断 fixture 的来源说明。
- [`scripts/fixtures/checkee/2026-01-access-blocked.html`](../../scripts/fixtures/checkee/2026-01-access-blocked.html)
- [`scripts/fixtures/checkee/2026-08-access-blocked.html`](../../scripts/fixtures/checkee/2026-08-access-blocked.html)
- `scripts/fixtures/checkee/fixtures.test.ts`：确认阻断 fixture 不含页面正文、评论、Details 或个人字段。
- `AGENTS.md`、`README.md`、`docs/architecture.md` 和历史产品/字段文档已迁移或标记 superseded。

## 5. 数据计数与排除报告

由于两个目标月份页均返回 403，没有合法的原始行可统计：

| 指标                   |                 结果 |
| ---------------------- | -------------------: |
| 已成功读取的目标月份页 |                0 / 2 |
| 已解析原始行           |                    0 |
| F-1 纳入数             |       未知，不得推断 |
| 五地纳入数             |       未知，不得推断 |
| `access_blocked`       |                    2 |
| 其他排除原因           | 未运行解析，暂不统计 |

## 6. 验证结果

- `npm run format:check`：PASS
- `npm run lint`：PASS
- `npm run typecheck`：PASS
- `npm run test`：PASS，3 个测试文件、4 个测试通过（含 2 个阻断 fixture 测试）
- `npm run build`：PASS
- 线上访问：按规则对两个月份页遇到 403 后 fail closed；没有高频重试。

## 7. 已知限制与下一阶段输入

- 访问许可和月份页结构尚未确认，阶段 4 不应开始实现生产抓取和 parser schema。
- 需要来源方允许读取月份页，或由用户提供明确授权且已脱敏的两个真实月份 HTML fixture；取得后先更新 source contract，再进行阶段 4。
- 当前页面仍是上一阶段视觉 Demo，不应被解释为已接入 Checkee 数据。
- 阶段 3 没有修改远程仓库、没有 push、没有部署，也没有提交用户提供的总需求文档副本。

## 下一阶段输入

只有在 Checkee 月份页可合规访问、robots/条款结论明确、真实脱敏 fixture 可复现后，才进入阶段 4：实现低频、可缓存、可中断的抓取/解析/标准化管线。
