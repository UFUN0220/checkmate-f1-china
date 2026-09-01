# Checkmate UI 内容精简报告

日期：2026-09-01  
基线：`81ae0e6 feat: finalize stage 3k product metrics`  
状态：完成（本地、未推送）

## 本次调整

- Page1 删除“F-1 公开样本”“五个核心领区”“五城等待分布”和可见操作提示；五张城市卡直接成为内容入口。
- Page2 删除“匿名案例”、重复的 Page2/数据集标签和内部重复标题；保留案例数、Approve、Q1/Median/Q3 与展开按钮。
- 顶部导航只保留“白宫严选”和“名人堂”，移除右侧 dataset 状态标签。
- Page1 标题 `2026年度白宫严选中国F1硕博` 使用既有 `HYBlackMythU`，改为居中并通过 `clamp()` 放大。
- Page2 标题“名人堂”使用既有 `HYBlackMythU`，居中并保持略小于 Page1 主标题。
- 移动端使用独立 `clamp()` 尺寸和紧凑间距，避免标题横向溢出；未重做导航、logo 或 design system。
- 数据说明收缩为折叠区域，footer 保留统一 disclaimer。

## 未改变

Page1/Page2 数据、解析器、Page2 XLSX 管线、Q1/Median/Q3、月度趋势、`waitingDays`、排序、分页、路由兼容、snapshot、隐私边界、offline guard 与 `CHECKEE_ACCESS_MODE=disabled` 均未改变。

## 验证

- `npm test`：10 个测试文件、52 个测试通过。
- Stage 3L 修改文件 Prettier check：通过。
- 本次修改后重新运行 lint、typecheck、Checkee/Page2 数据校验和 build，均通过。
- 全局 format check 继续受既有未提交 `pnpm-lock.yaml` 影响；`data:manual:validate` 继续受环境缺少 `esbuild` 影响，均未扩大本阶段范围。
