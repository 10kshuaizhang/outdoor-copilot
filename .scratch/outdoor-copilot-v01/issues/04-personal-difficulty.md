# 04 — 个人难度（档案 + Base vs Personal）

**What to build:** 用户在基础报告后可完善或跳过 Outdoor Profile，得到个人报告：Base 与 Personal Overall 并排、Endurance / Climbing / Weather / Risk 分项、中文档位、Confidence。跳过时用默认模型且置信度更低。

**Blocked by:** 02 — 示例路线 → 基础报告

**Status:** ready-for-agent

## Acceptance criteria

- [x] 四问（经验、舒适距离、舒适爬升、风险偏好）可填；可跳过进入个人报告
- [x] 可选展开生理字段（年龄/身高/体重/静息心率等）；缺省不阻断
- [x] 报告并排展示 Base vs Personal Overall，并展示四维分项与档位（轻松/适中/吃力/很难/不建议）
- [x] 展示 Confidence；档案更完整时不低于更缺省情形（同路线同天气前提下）
- [x] 行为测试：更高经验或更大舒适区 → `personalOverall` 不上升
- [x] 本机单档案持久化，二次进入仍保留

**Status note:** completed 2026-08-08

## Parent

Spec: `docs/superpowers/specs/2026-08-08-outdoor-copilot-v01-design.md`
