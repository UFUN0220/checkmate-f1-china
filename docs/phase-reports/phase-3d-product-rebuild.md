# 阶段 3D：静态数据 Demo 产品化与视觉验收报告

日期：2026-08-31

状态：已完成离线实现与本地视觉验收；真实 Checkee 访问仍为 `CHECKEE_ACCESS_BLOCKED`。

## 1. 本阶段结果

- 单页信息架构完成：城市等待情况、同学样本、Check 名人堂三个主区块。
- 城市卡片展示北京、上海、广州、武汉、沈阳的 Q1 / 中位数 / Q3 与样本量；点击城市后原地展开详情和案例卡片，并同步 `?city=` URL 状态。
- 公共案例改为卡片式时间线表达，等待天数为主视觉；Pending 显示“截至 2026-08-31”，已结束记录显示实际结束日期。
- 新增独立 mock 数据入口：`mock-public-cases.json` 20 条、`mock-peer-cases.json` 100 条、`mock-hall-of-fame.json` 10 条，全部带 `isMock: true`，页面持续显示 `DEMO DATA`。
- 名人堂使用统一时长降序统计，前三名分别使用金 / 银 / 铜视觉层级；不连接真实个人信息或外部服务。
- 页面加入 `STATIC SNAPSHOT`、数据截止日期、来源关系、非官方处理时间和方法说明；没有地图、登录、筛选器构建器、预测或定时抓取。

## 2. 数据与统计基础

- 新增集中快照配置：`DATA_SNAPSHOT.cutoffDate = 2026-08-31`。
- `PublicCase` 增加 `effectiveEndDate`、`durationDays` 和 `durationSource`；Pending 统一使用快照截止日，已结束记录使用实际结束日期。
- 新增共享 `WaitStats` 与 `calculateWaitStats`，统一计算 Q1、Median、Q3 和有效样本数。
- 新增 `calculateHallOfFame` 与时长降序排序函数；原有 Pending age、Clear resolved duration、分组样本量和小样本规则保持独立。
- 重新生成静态快照：公开案例 475 条，Pending 262、Clear 209、Reject 4；内容 hash 为 `fnv1a-727b5c59`。

## 3. 验证记录

- `npm run check:offline`：通过。
- `npm run format:check`：通过。
- `npm run lint`：通过。
- `npm run typecheck`：通过。
- `npm test`：7 个测试文件、33 个测试通过。
- `npm run data:checkee:validate`：通过，`rawHtmlNotRead=true`，公开案例 475 条。
- `npm run build`：通过，首页为静态预渲染路由 `/`。
- `npm run data:checkee:fetch`：按预期失败并明确提示 `CHECKEE_ACCESS_MODE=disabled`，未发起真实请求。
- 本地 Chrome 完成桌面端与窄屏截图验收；窄屏测试使用独立设备比例，确认三列导航、单列 Hero、城市双列卡片和案例紧凑布局可用。

## 4. 限制与下一阶段输入

- 当前数据仍是已获准保存的本地静态脱敏快照和明确标记的开发 mock，不是实时 Checkee 数据；页面不得对外宣称实时或代表总体概率。
- `CheckeeHtmlAdapter` 仍保持 disabled/fail-closed；没有实现猜测 DOM、Cookie、代理、验证码绕过或定时抓取。
- 下一步可做产品细化：城市详情和案例列表的视觉微调、键盘焦点/屏幕阅读器复核、空状态与 stale 状态补充，以及在获得明确授权后接入同一 `NormalizedCase` 契约的 CSV/JSON adapter。
