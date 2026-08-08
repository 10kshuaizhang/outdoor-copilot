# 01 — 脚手架与 Landing

**What to build:** 用户打开产品即看到中文、Mobile-first 的 Outdoor Copilot（个人户外智能）落地页：品牌英雄级呈现、一句主文案、主 CTA「分析我的路线」。工程具备可运行的 Next.js 应用，以及可供后续切片填充的 `analyzeRoute` 分析入口（可先返回占位结构）。

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

## Acceptance criteria

- [x] 本地可启动应用，手机宽度下首屏可读，品牌名是英雄级信号而非仅导航字
- [x] 落地页含主 CTA，可进入后续分析流程入口（即使下一页仍简单）
- [x] 存在单一分析入口 `analyzeRoute`（可先为 stub），后续工单在此扩展而非另起平行入口
- [x] 视觉方向为户外实地感（非紫渐变 AI 仪表盘风）；首屏无统计条/功能宫格堆砌

**Status note:** completed 2026-08-08

## Parent

Spec: `docs/superpowers/specs/2026-08-08-outdoor-copilot-v01-design.md`
