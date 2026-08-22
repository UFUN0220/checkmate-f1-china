# F-1 Visa Check 数据看板：协作约定

## 目录职责

- `app/`：Next.js App Router 页面与全局样式。
- `components/`：可复用的展示与交互组件；阶段 0 不放业务图表。
- `lib/data/`：数据契约、公开模型和只读数据访问逻辑。
- `lib/analytics/`：不依赖 React 的纯统计函数。
- `scripts/`：仅在开发/同步阶段运行的导入、审计和质量门禁脚本。
- `data/private/`：原始 Excel、完整审核记录等私有输入，只能本地存在，永不提交。
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
- 页面负责组合，组件负责单一展示/交互职责；不要在展示组件里解析原始 Excel。
- 浏览器端只能读取公开安全产物；原始数据、内部模型和同步凭证不得进入客户端 bundle。
- 统计字段命名必须区分 pending age 与 resolved duration，避免含混的 `averageWaitTime`。

## 产品范围与审核边界

- 当前 Demo 只关注中国大陆申请地点的 F-1 Check 案例，采用“全国概览 → 地点指标 → 人工审核案例记录”三级下钻。
- 地点占比只能称为“本站样本分布”，不能称为领馆 Check 率或官方处理速度。
- 人工审核只代表格式、逻辑、重复和隐私检查，不代表美国政府认证或完全真实性认证。
- `docs/public-field-policy.md` 是公开字段的唯一细则：学校、精确面签日期、Case Update 和备注可以在人工审核清洗后公开；联系方式、案件号和身份字段必须删除。

## 数据隐私红线

- `data/private/`、原始 xlsx/csv、未审核自由文本、联系方式、案件标识、源表行号和审核人员信息不得进入 Git、`public/`、静态产物、日志、source map 或测试快照。
- 允许公开的学校、精确面签日期、Case Update 和备注必须来自 `verified_for_publish` 记录，并经过敏感信息清洗；不得把原文直接当作安全字段。
- 不收集或要求姓名、护照号、DS-160、SEVIS ID、Case Number、邮箱、微信号或 QQ。
- 公开案例必须经过 schema 校验、PII 扫描和重识别风险检查；命中即失败。

## 统计口径

- 这是当前众包样本的描述性工具，不代表总体概率、官方处理速度或个案结果。
- 原始 `Check` 默认是 pending；`Approve` 不等于 `Issued`。
- CEAC `Refused` 在部分 221(g) 行政审查场景中不等于最终拒签；未经人工确认不得归为最终拒签。
- 每个统计都带样本量/分母；`n < 5` 不做分组结论，`5–9` 标记样本较少。
- 不使用当前单一年份的数据声称同比恶化，也不预测具体出签日期。

## 禁止事项

- 不抓取网页、Cookie、浏览器会话或个人登录态同步外部文档。
- 不接入数据库、登录、用户追踪、自动 CEAC 查询或未经授权的外部写操作。
- 不提交原始数据，不 push，不部署生产，除非用户在对应阶段明确授权。

## 完成定义

每阶段都必须：实现该阶段范围、运行相关 lint/format/typecheck/test/build 与必要的浏览器验证、更新阶段报告、记录限制和下一阶段输入；如创建 commit，只创建本地 commit。
