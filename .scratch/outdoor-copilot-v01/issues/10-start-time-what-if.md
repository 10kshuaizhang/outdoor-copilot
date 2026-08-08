# 10 — 出发时刻 what-if

**What to build:** 用户在个人报告上修改计划出发时刻后，系统重算预计完成窗口与相关风险提示，无需重新上传或重解析 GPX；可与推荐出发时刻对照。

**Blocked by:** 05 — 天气与出发建议

**Status:** ready-for-agent

## Acceptance criteria

- [ ] 报告提供出发时刻控件（或等价输入），默认值为推荐出发或用户已选时刻
- [ ] 修改后完成窗口与风险相关文案/分项更新，路线几何与分段不重新要求上传
- [ ] 更晚出发若逼近/超过日落，风险提示明显加强
- [ ] 不实现「砍掉最后 N km」类几何 what-if（明确排除）

## Parent

Spec: `docs/superpowers/specs/2026-08-08-outdoor-copilot-v01-design.md`
