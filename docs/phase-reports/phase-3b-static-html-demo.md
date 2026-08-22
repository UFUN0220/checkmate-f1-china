# 阶段 3B：手工 HTML 静态快照接入与临时 Demo

日期：2026-08-23
状态：已完成离线实现；Checkee 访问仍为 `CHECKEE_ACCESS_BLOCKED`。最终提交信息：`feat: build static Checkee HTML demo`；具体 hash 以仓库最终 `git log -1` 为准。

## 交付内容

- 新增 `ManualCheckeeHtmlAdapter`，按本地保存页面的真实 table 结构解析 8 个 2026-01 至 2026-08 页面。
- 统一输出现有 `NormalizedCase`，由 `PublicSnapshot` 负责公开字段、manifest、质量报告、统计和对账。
- 新增本地 inspect/import/validate 命令；默认路径为 `dataset_260823/`，不接受网络 URL。
- 页面默认改为读取非实时 `STATIC SNAPSHOT`；保留显式 `demo-fixture` 回退。
- 案例页支持地点、状态、月份、Degree、Major Group、Initial/Renewal 多选，字段内 OR、字段间 AND，并写入 URL。
- 公开案例只保留匿名公共模型字段；源 ID、Details、原始 HTML 和内部 key 不进入 public JSON。
- 添加静态 HTML 契约、脱敏解析夹具、查询语义测试、导入审计报告和公开 manifest。

## 实际导入结果

输入是本地 8 页 HTML，原始数据行 1,463，解析 1,463，隔离 0，公开案例 475。状态为 Pending 262、Clear 209、Reject 4；地点为北京 177、上海 34、广州 158、沈阳 55、武汉 51。公开快照 checksum 为 `fnv1a-a102f6e7`，`isLive=false`，`sourceMode=manual-html-static`，`demoData=false`。

质量报告记录：非 F-1 890 条、F-1 但未知地点 30 条、重复候选键 76 组；精确重复 5、可能重复指纹组 10、敏感字段命中 0、schema guard 通过。排除原因是候选级记录，部分计数可能重叠，不应简单相加推导总排除数。

统计结果：Pending age 中位数 68 天、P75 94 天、最长 230 天；Clear duration 有效样本 209 条，中位数 50 天、P75 64 天；Check 日期范围为 2026-01-05 至 2026-08-21。2026-08 为当前不完整月份。

## 验证记录

已运行：

```text
npm run data:checkee:inspect       PASS
npm run data:checkee:import-static PASS
npm run data:checkee:validate      PASS
npm run lint                       PASS
npm run typecheck                  PASS
npm test                           PASS
npm run format:check               PASS
npm run build                      PASS
```

自动化测试覆盖静态 HTML 表格定位、月份校验、表头 schema fail-closed、F-1 alias、五地点白名单、状态和日期排除、缺失完成日期、等待日、匿名公开字段、重复统计、查询 URL 往返、同字段 OR/跨字段 AND、空结果、指标对账、顺序无关、幂等和参考谓词等语义。

组件级页面测试已验证默认 `STATIC SNAPSHOT`、475 条样本、地点下钻、案例列表、Pending 筛选和 URL 状态。已尝试启动本地页面进行桌面/移动窄屏和控制台验证，但本环境浏览器安全策略拒绝访问 `http://localhost:3000`；因此桌面、移动和控制台结果记为 `NOT VERIFIED (browser policy blocked localhost)`，没有用替代通道或绕过方式虚构通过。该验证过程没有访问 Checkee。

## 限制和下一步

- 这是手工保存的静态页面，不是实时抓取，也没有证明页面未来 DOM 不变。
- 当前不能根据静态快照推断总体概率、官方处理速度、同比趋势或个案出签日期。
- Pending 的来源 Waiting Day(s) 没有用实时导入时间重新验证，因此页面明确标注为静态等待天数。
- `CheckeeHtmlAdapter` 继续 fail closed；未经授权不实现生产 HTML 抓取、定时任务、Cookie、代理或绕过 403/429/验证码的逻辑。
- 后续如获授权，应先更新 source contract 和访问状态，再添加独立生产 adapter；统计和前端无需改写。
