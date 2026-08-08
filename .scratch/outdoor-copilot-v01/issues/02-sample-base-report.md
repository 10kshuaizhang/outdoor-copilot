# 02 — 示例路线 → 基础报告

**What to build:** 用户无需自备 GPX，点选 2–3 条内置示例之一即可完成分析，看到基础路线报告：距离、爬升、Base Difficulty、海拔剖面，并理解「路线基础负荷」。`analyzeRoute` 对 fixture 产出稳定的路线统计与基础分。

**Blocked by:** 01 — 脚手架与 Landing

**Status:** ready-for-agent

## Acceptance criteria

- [ ] 至少 2 条内置示例可一键分析并进入基础报告
- [ ] 报告展示距离、爬升、Base Overall（及基础分项或等价摘要）、海拔剖面
- [ ] 自适应分段已参与计算（即使 UI 不展示全部分段表）
- [ ] `analyzeRoute` fixture 测试：距离/爬升（及分段或最长连续爬升相关稳定量）在容差内锁定
- [ ] 报告含简短免责声明占位或最终文案（可与 07 再润色，但不得缺失安全提示）

## Parent

Spec: `docs/superpowers/specs/2026-08-08-outdoor-copilot-v01-design.md`
