# 架构说明（阶段 0）

## 运行时

- Next.js App Router + TypeScript：页面与后续静态数据展示。
- Tailwind CSS：基础样式；阶段 0 只提供占位页，不预设最终视觉方向。
- Vitest：纯函数与契约测试；后续可加入 Testing Library 与 Playwright。
- npm lockfile：依赖安装必须可复现，并在更新后执行安全审计。

## 数据流边界

```text
data/private/*.xlsx
        │ 仅脚本/开发阶段读取
        ▼
审计 → 规范化 → schema 校验 → PII 扫描 → 统计
        │
        ▼
data/generated/*.json  ──> app/components 浏览器端
```

阶段 1 仍不实现数据流，只固定 Demo 的产品边界。原始 Excel、内部模型和同步凭证不得被 `app/` 或浏览器 bundle 引用；后续只有 `verified_for_publish` 的安全公开字段可以进入前端。

## 目录职责

目录约定见根目录 `AGENTS.md`。阶段 1 已建立 Demo 范围、三级信息架构、人工审核政策和公开字段政策；后续数据层再建立内部模型和公开模型，统计模块与正式视觉方案仍待后续阶段。

## 依赖与构建原则

- 使用执行时仍受支持的包版本，并通过 `npm audit` 检查已知漏洞。
- Excel 解析依赖只在脚本侧使用，不进入生产浏览器包。
- 首版不引入数据库、登录、用户追踪或外部同步。
- 每阶段运行 lint、format check、typecheck、test、build 以及与改动相关的额外验证。

## 安全与隐私门禁

公开产物必须只含公开 schema 允许的字段，并在构建前后扫描邮箱、手机号、微信/QQ、学校自由文本、Case Update 原文和其他可识别信息。任何命中都应使构建失败。
