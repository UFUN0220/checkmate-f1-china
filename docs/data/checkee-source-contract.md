# Checkee 来源契约

状态：`CHECKEE_ACCESS_BLOCKED`（在线月份页访问仍受限；阶段 3B 仅依据用户提供的本地静态 HTML 完成离线解析）

## 来源范围

- `sourceName`: `checkee.info`
- 根入口：<https://www.checkee.info/>
- 历史月份入口形式：`https://www.checkee.info/main.php?dispdate=YYYY-MM`
- 首个目标月份：`2026-01`
- 验证时当前月份：`2026-08`
- 目标筛选：显式确认的 F-1 alias、中国大陆五个地点、`checkDate >= 2026-01-01`。

## 阶段 3 在线验证记录

验证日期：2026-08-22。请求使用可识别的 User-Agent：
`CheckMate-F1-China/0.1 (+https://github.com/UFUN0220/checkmate-f1-china)`。

| 目标                        | 结果     | 结论                                                                                                                                                                    |
| --------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/robots.txt`               | HTTP 200 | 可读取，但对 `User-agent: *` 同时出现 `Content-Signal: search=yes,ai-train=no,use=reference`、`Allow: /` 与后续 `Disallow: /`；本项目按保守口径将自动抓取视为不被允许。 |
| `/`                         | HTTP 200 | 首页公开可达；可见月份导航、`report_case.php`、捐赠入口和 CEAC 外链。未发现独立 Terms/Privacy 链接。                                                                    |
| `main.php?dispdate=2026-01` | HTTP 403 | 未读取页面正文；停止验证。                                                                                                                                              |
| `main.php?dispdate=2026-08` | HTTP 403 | 未读取页面正文；停止验证。                                                                                                                                              |

这意味着当前阶段不能可靠确认月份页的表头、列顺序、F-1 写法、地点写法、状态值、分页、日期格式或空值表示。不得根据历史爬虫、搜索摘要或旧 Excel 猜测 DOM。

## 阶段 3B 本地静态快照补充

用户提供的 `2601.html` 至 `2608.html` 已在本地离线检查并用于生成 `manual-html-static` 快照。该证据只证明这 8 个保存文件的结构，不构成在线访问授权，也不证明未来页面结构稳定。离线契约、实际表头和解析门禁见 [`checkee-static-html-contract.md`](checkee-static-html-contract.md)。

`ManualCheckeeHtmlAdapter` 只接受本地路径，默认导入命令不会发起网络请求。生产 `CheckeeHtmlAdapter` 仍 fail closed，直到获得明确授权并重新确认在线 source contract。

## 访问边界

阶段 3 只允许读取无需登录、Cookie、验证码或个人案件查询的公开入口。发现 403、429、验证码、访问控制或结构异常时必须 fail closed；不得重试风暴、代理轮换、伪装 User-Agent、绕过 Cloudflare、抓 CEAC 或读取 `report_case.php` / `personal_detail.php` 的个人字段。

在来源访问重新获得明确许可前：

- 不实现生产抓取器；只允许运行本地手工 HTML 静态导入。
- 不在前端、build、test 或 CI 中访问 Checkee。
- 不生成伪造的 2026-01 至当前月份数据；静态快照必须持续标记来源、快照时间和非实时状态。
- 不把首页月份导航当成已验证的月份数据结构。

若未来获得明确可访问性，抓取器必须串行、默认间隔不少于 3 秒、带磁盘缓存、有限超时与重试、可中断，并优先使用 ETag/Last-Modified。显式 refresh 每天最多完整验证一次 2026-01 至当前月份。

## 计划中的来源元数据

每个成功快照记录：

- `sourceName`
- `sourceUrl`
- `rangeStart`
- `rangeEnd`
- `fetchedAt`
- `snapshotDate`
- `parserVersion`
- `rawPageCount`
- `includedCount`
- `excludedCountByReason`
- `statusCounts`
- `locationCounts`
- `contentHash`

原始 HTML 仅能存在 Git 忽略的私有缓存目录，不进入 `public/`、Git 历史、CI artifact 或部署包。日志只能记录月份、状态码、耗时和摘要，不能记录页面正文、Cookie、响应头或记录详情。

## 访问恢复后的待确认解析契约

必须先用脱敏 fixture 确认下列事实，再实现阶段 4：

1. 表头、列数和月份导航是否稳定。
2. F-1 是否只出现 `F1`、`F-1` 或其他明确值。
3. 五地及其拼写变体的真实值。
4. `Pending`、`Clear`、`Reject`、未知状态的真实写法。
5. `YYYY-MM-DD`、空日期和 `0000-00-00` 等日期表现。
6. 是否存在分页、隐藏列、编码问题或结构差异。

没有这些在线授权和稳定性证据前，任何 parser schema 都必须拒绝作为生产抓取器运行；本阶段的本地 parser 只能生成明确标注 `manual-html-static`、`isLive=false` 的离线快照。

## 归属文案

页面必须使用：

> 数据来源：Checkee.info 公开用户自报样本；本项目非官方，亦未经本站逐条事实核验。

并明确：项目与 Checkee.info、美国国务院、美国驻华使领馆没有隶属或授权关系；数据只代表进入 Checkee 报告体系的公开样本。
