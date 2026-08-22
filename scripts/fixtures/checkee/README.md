# Checkee fixtures

阶段 3 的两个目标月份页均返回 HTTP 403，且 `robots.txt` 的保守解释不允许自动抓取。因此当前目录只保存用于 fail-closed 测试的最小、脱敏阻断响应片段，不声称它们是成功解析的 Checkee 月份页面。

- `2026-01-access-blocked.html`
- `2026-08-access-blocked.html`

这些文件不包含 Checkee 页面正文、记录、评论、Details、来源 ID、Cookie、响应头或个人信息。阶段 4 必须先取得合规可访问的样本页面，再用真实 DOM 片段替换/补充 parser fixtures；不得凭历史项目或旧 Excel 猜测结构。
