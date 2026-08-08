# 06 — 生理混合层 + Why

**What to build:** 报告的 Why 列出可解释贡献项；在时长中位代入下启用论文生理负荷估计层（缺身高体重心率则用默认并降置信度）；次要展示估算生理强度等级；负重默认 5kg 可改。主叙事仍是 Personal Difficulty，不把学术等级当唯一结论。

**Blocked by:** 04 — 个人难度（档案 + Base vs Personal）；05 — 天气与出发建议

**Status:** ready-for-agent

## Acceptance criteria

- [ ] Why 列表含结构化贡献项（文案 + delta 或等价加减说明），数字来自引擎而非 LLM
- [ ] 生理负荷层使用预计总时长中位 `t`，避免规划场景循环依赖
- [ ] 缺省生理字段仍能出全量报告；有字段时 Confidence 更高（同其他条件）
- [ ] 负重默认 5kg，用户可改并影响结果
- [ ] 次要展示「估算生理强度等级（参考）」并注明局限/参考属性
- [ ] 天气相关贡献或系数与已定天气输入一致（含论文量级系数的产品化使用）

## Parent

Spec: `docs/superpowers/specs/2026-08-08-outdoor-copilot-v01-design.md`  
Reference: 刘泓舟等《户外运动强度测定与定级》(2022)
