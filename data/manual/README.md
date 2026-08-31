# 手工数据入口

这两个 JSON 文件是可选的、匿名的手工数据入口：

- `peer-sample.json`：替换为 `PeerCaseInput[]` 后，运行 `npm run data:manual:validate`。
- `hall-of-fame.json`：替换为 `HallOfFameInput[]` 后，运行同一命令。

空数组会自动回退到现有 mock 数据并显示 `DEMO DATA`。非空文件如果校验失败会 fail closed，不会静默修复或回退。禁止填写姓名、联系方式、护照号、SEVIS ID、DS-160 或其他可识别个人的信息。

最小字段见 `lib/data/manual-datasets.ts`。日期为 `YYYY-MM-DD`；`pending` 不填 `endDate`，`clear` / `reject` 必须填写 `endDate`。
