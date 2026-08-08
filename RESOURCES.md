# Outdoor Copilot 实现 Resources

## Knowledge

- [Spec: Outdoor Copilot V0.1 Design](docs/superpowers/specs/2026-08-08-outdoor-copilot-v01-design.md)
  产品边界、模块划分、`analyzeRoute` 单一入口、LLM 禁令。Use for: 任何「该不该做 / 分数谁说了算」的判断。
- [README — 用户交互与系统怎么工作](README.md)
  页面流与管道摘要。Use for: 快速回顾产品闭环。
- [Next.js App Router 官方文档](https://nextjs.org/docs/app)
  `app/` 文件系统路由、`page.tsx` / `layout.tsx` / Route Handlers。Use for: 解释 `src/app/*` 为何长这样。
- [GPX: the GPS Exchange Format — TopoGrafix](https://www.topografix.com/gpx.asp)
  GPX 是轨迹交换的事实标准（waypoints / routes / tracks）。Use for: 理解上传文件为何是 XML 点列。
- [Open-Meteo Forecast API Docs](https://open-meteo.com/en/docs)
  无 Key 的坐标天气 JSON API。Use for: `/api/weather` 代理的外部真相来源。
- [刘泓舟等 — 户外运动强度测定与定级（汉斯出版社）](https://www.hanspub.org/journal/PaperInformation?paperID=55411)
  生理负荷参考层公式出处。Use for: `physiology.ts` 为何存在、为何是次要信息。
- [Vitest 官方文档](https://vitest.dev/)
  本仓库用 Vitest 锁引擎行为。Use for: 理解 `analyzeRoute` 作为测试 seam。

## Wisdom (Communities)

- [r/hiking](https://www.reddit.com/r/hiking/)
  真实徒步者对「难度标签是否有用」的反馈场。Use for: 产品叙事与字段是否接地气（非算法权威）。
- [Next.js Discussions (GitHub)](https://github.com/vercel/next.js/discussions)
  框架实现问题的高信号讨论。Use for: App Router / Route Handler 疑难。

## Gaps

- 尚无独立的「个人难度」公开标准或对标论文；本产品以自有 Spec + 生理负荷论文混合。后续若出现可复现基准数据集，应补进 Knowledge。
