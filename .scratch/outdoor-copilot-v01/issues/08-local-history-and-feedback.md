# 08 — 本地历史与回填

**What to build:** 用户完成本地保存的分析后，可在历史中打开快照、用当前档案重新分析；可回填实际用时与主观难度（不自动反训模型）；可导出本地事件、清除全部本地数据。无账号、无云同步。

**Blocked by:** 04 — 个人难度（档案 + Base vs Personal）

**Status:** ready-for-agent

## Acceptance criteria

- [ ] 分析完成后可在历史列表看到记录并打开只读快照（含当时档案/天气快照语义）
- [ ] 支持对已有路线用当前档案重新分析
- [ ] 可录入实际总时长与主观难度（1–5），持久化且不改变既有引擎权重（无反训）
- [ ] 本地事件覆盖 upload / analyze_base / analyze_personal / copy_share / feedback 等关键行为，可导出
- [ ] 「清除全部本地数据」后档案、历史、事件不可再读到
- [ ] IndexedDB 不可用时有降级提示（内存会话），不静默假装已保存

## Parent

Spec: `docs/superpowers/specs/2026-08-08-outdoor-copilot-v01-design.md`
