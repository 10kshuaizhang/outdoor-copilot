# 09 — 解释层（模板 + 可选 LLM）

**What to build:** 每份个人报告都有中文解释：默认由模板基于引擎 JSON 生成；若配置了 OpenAI 兼容 API，则自动润色，且不得改动任何关键数字或发明挑战公里段；无 Key/失败时静默回落模板。

**Blocked by:** 06 — 生理混合层 + Why

**Status:** ready-for-agent

## Acceptance criteria

- [x] 无 LLM 配置时报告仍显示完整模板解释
- [x] 有 `baseURL` + `apiKey` + `model` 时走可选 explain 代理并展示润色文案
- [x] Prompt/服务端约束：只解释给定 JSON，不输出与引擎冲突的分数或路段
- [x] API 超时或错误时回落模板，不阻断报告主数字
- [x] 解释来源可区分（template | llm）以便调试与信任

**Status note:** completed 2026-08-08
