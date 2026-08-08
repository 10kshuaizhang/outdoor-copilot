# 05 — 天气与出发建议

**What to build:** 用户选择出行日期（及可选计划出发时刻）后，报告纳入天气影响，给出预估时长区间、推荐出发时刻与预计完成窗口；天气 API 失败时中性 fallback，报告仍完整。

**Blocked by:** 04 — 个人难度（档案 + Base vs Personal）

**Status:** ready-for-agent

## Acceptance criteria

- [ ] 可选出行日期；位置取路线中心点请求天气（Open-Meteo 经可选代理）
- [ ] 失败时 fallback 中性天气，Confidence 下降并在结果中可感知（如 Why 或来源标记）
- [ ] 展示时长区间（非单点）与推荐出发 / 完成窗口
- [ ] 行为测试：高温天气相对中性天气，`personalOverall` 与 `duration.high` 不降低
- [ ] 极端天气（如雷暴高风险）在建议区有强提示

## Parent

Spec: `docs/superpowers/specs/2026-08-08-outdoor-copilot-v01-design.md`
