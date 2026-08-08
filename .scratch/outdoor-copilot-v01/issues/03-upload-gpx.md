# 03 — 上传 GPX

**What to build:** 用户可上传自己的 `.gpx`，走与示例相同的基础报告路径；坏文件、无轨迹点等失败时看到清晰中文错误，并可改选示例。

**Blocked by:** 02 — 示例路线 → 基础报告

**Status:** ready-for-agent

## Acceptance criteria

- [x] 支持上传 `.gpx` 并生成与示例一致结构的基础报告
- [x] 非 GPX / 无 track 点 / 明显无效文件时阻断并给出中文错误，不进入空报告
- [x] 过大文件或点数过高时有明确限制与提示
- [x] 上传成功写入本地分析事件（或等价本地记录），便于后续 Activation 观察

**Status note:** completed 2026-08-08

## Parent

Spec: `docs/superpowers/specs/2026-08-08-outdoor-copilot-v01-design.md`
