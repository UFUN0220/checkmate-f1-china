# F-1 Visa Check 数据看板：协作约定

## 目录职责

- `app/`：Next.js App Router 页面与全局样式。
- `components/`：可复用的展示与交互组件；浏览器端只能读取 `data/generated/` 的安全公开产物。
- `lib/data/`：数据契约、公开模型和只读数据访问逻辑。
- `lib/analytics/`：不依赖 React 的纯统计函数。
- `scripts/`：仅在开发/同步阶段运行的导入、审计和质量门禁脚本。
- `data/private/`：Checkee 原始 HTML 缓存、完整内部标准化记录和抓取审计，只能本地存在，永不提交。
- `data/config/`：可审计的映射、规则和版本化配置。
- `data/generated/`：经过 schema 与 PII 门禁的公开安全产物。
- `docs/`：产品、数据、隐私、架构与阶段报告。

## 常用命令

```bash
npm install
npm run dev
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npm run audit
```

Node.js 使用 `package.json` 中声明的最低版本。依赖安装必须提交 lockfile；更新依赖后运行安全审计。

## TypeScript 与组件约定

- TypeScript 开启 strict；优先使用明确的类型和小型纯函数。
- 页面负责组合，组件负责单一展示/交互职责；不要在展示组件里解析 Checkee 原始 HTML 或内部记录。
- 浏览器端只能读取公开安全产物；原始数据、内部模型和同步凭证不得进入客户端 bundle。
- 统计字段命名必须区分 pending age 与 resolved duration，避免含混的 `averageWaitTime`。

## 产品范围与来源边界

- 当前 Demo 只关注 Checkee.info 自 2026-01-01 起的中国大陆 F-1 公开样本，采用“全国概览 → 地点指标 → Checkee F-1 标准化案例”三级下钻。
- 唯一来源是 Checkee.info；不得合并旧 Excel、PIVIB、CEAC 或其他来源。
- 地点只允许北京、上海、广州、沈阳、武汉及已确认的拼写变体；地点占比只能称为“Checkee F-1 公开样本分布”。
- `docs/data/checkee-source-contract.md` 和 `docs/data/checkee-data-dictionary.md` 是新版来源与字段契约；旧人工审核/本地投稿文档已被 superseded。

## 数据隐私红线

- `data/private/`、原始 HTML、未审核自由文本、联系方式、案件标识、源表行号和内部 key 不得进入 Git、`public/`、静态产物、日志、source map 或测试快照。
- 公开案例只允许使用新版数据字典定义的最小字段；原始 Comments、Details、学校、姓名、联系方式、来源记录 ID 和可回溯来源链接禁止公开。
- 不收集或要求姓名、护照号、DS-160、SEVIS ID、Case Number、邮箱、微信号或 QQ。
- 公开案例必须经过 schema 校验、PII 扫描和重识别风险检查；命中即失败。

## 统计口径

- 这是当前众包样本的描述性工具，不代表总体概率、官方处理速度或个案结果。
- Checkee `Pending`、`Clear`、`Reject` 保留来源语义，不自动改写为 `Issued`、`Administrative Processing` 或最终拒签。
- Pending age 与 Clear resolved duration 必须使用不同字段和公式；Reject 不参与 resolved duration。
- 每个统计都带样本量/分母；`n < 5` 不做分组结论，`5–9` 标记样本较少。
- 不使用当前单一年份的数据声称同比恶化，也不预测具体出签日期。

## 禁止事项

- 不抓取 CEAC、Cookie、浏览器会话或个人登录态；Checkee 只有在 source contract 明确允许且未触发 403/429/验证码/结构异常时才可低频访问。
- 不在前端、普通 build、单元测试或 CI 中访问线上 Checkee；测试只使用脱敏 fixtures。
- 当前 Checkee 月份页验证返回 403，保持 fail closed，不实现生产抓取器。
- `CHECKEE_ACCESS_MODE` 默认必须是 `disabled`；`CheckeeHtmlAdapter` 在未授权时必须明确失败，不得发起网络请求。
- `DemoFixtureAdapter`、`CheckeeExportAdapter` 与未来的 `CheckeeHtmlAdapter` 只能输出同一套 `NormalizedCase`，统计和页面不得依赖来源 HTML。
- `DEMO_DATA` 必须在 manifest、页面来源提示和方法说明中持续可见；合成数据不能宣传为真实 Checkee 数据。
- 不接入数据库、登录、用户追踪、自动 CEAC 查询或未经授权的外部写操作。
- 不提交原始数据，不 push，不部署生产，除非用户在对应阶段明确授权。

## 完成定义

每阶段都必须：实现该阶段范围、运行相关 lint/format/typecheck/test/build 与必要的浏览器验证、更新阶段报告、记录限制和下一阶段输入；如创建 commit，只创建本地 commit。
