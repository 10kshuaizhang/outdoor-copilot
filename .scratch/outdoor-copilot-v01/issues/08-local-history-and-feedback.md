# 08 — 本地历史与回填

**What to build:** 用户完成本地保存的分析后，可在历史中打开快照、用当前档案重新分析；可回填实际用时与主观难度（不自动反训模型）；可导出本地事件、清除全部本地数据。无账号、无云同步。

**Blocked by:** 04 — 个人难度（档案 + Base vs Personal）

**Status:** ready-for-agent

## Acceptance criteria

- [x] 分析完成后可在历史列表看到记录并打开只读快照（含当时档案/天气快照语义）
- [x] 支持对已有路线用当前档案重新分析
- [x] 可录入实际总时长与主观难度（1–5），持久化且不改变既有引擎权重（无反训）
- [x] 本地事件覆盖 upload / analyze_base / analyze_personal / copy_share / feedback 等关键行为，可导出
- [x] 「清除全部本地数据」后档案、历史、事件不可再读到
- [x] 本地存储写入失败时有明确提示，不静默假装已保存（实现为 localStorage）

**Status note:** completed 2026-08-08 — localStorage (not IndexedDB) with explicit save-failure messaging; history stores points for re-analyze; ActivityFeedback persisted locally
