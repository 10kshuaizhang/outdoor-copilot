# Outdoor Copilot V0.1 — Personal Route Intelligence Spec

**Version:** 0.1  
**Date:** 2026-08-08  
**Status:** Ready for implementation planning  
**Product:** Outdoor Copilot（个人户外智能）  
**Scope:** V0.1 Personal Route Intelligence only  

---

## Problem Statement

周末徒步者面对一条路线时，传统 App 只给出固定的距离、爬升和「中等难度」。这些数字描述的是路线，不是「我」。用户真正想知道的是：这条路对我来说难不难、要走多久、会不会天黑前走不出来、哪一段最容易爆掉、要不要早点出发。

现有 AI 徒步产品多在帮用户「找信息」，很少帮用户做「人 × 路线 × 环境」的户外决策。没有个人化难度，用户只能靠经验猜。

---

## Solution

Outdoor Copilot V0.1 让用户上传 GPX（或选择内置示例），先看到路线基础负荷分析，再可选填写个人能力与出行日期，得到：

- **Personal Difficulty**（对你的吃力程度，0–100 + 中文档位）
- 与 **Base Difficulty** 的对照
- 预估时长**区间**
- 主要挑战路段
- 天气影响与出发/完成建议
- 可解释的 Why（确定性贡献项）
- 可选 AI 润色解释（不创造关键数字）

全部核心计算在浏览器内完成；无账号；分析结果保存在本地。验证的是：Personal Difficulty 是否比传统 Route Difficulty 更有用。

---

## User Stories

1. As a 周末徒步者, I want to 打开产品立刻理解它解决什么问题, so that 我愿意尝试分析一条路线.
2. As a 没有自备 GPX 的访客, I want to 一键分析内置示例路线, so that 我能在 10 秒内看到完整报告.
3. As a 有 GPX 的徒步者, I want to 上传我的 `.gpx` 文件, so that 系统分析我真正要走的路线.
4. As a 上传失败的用户, I want to 看到清晰的中文错误说明, so that 我知道该换文件还是用示例.
5. As a 刚上传完的用户, I want to 立刻看到基础路线分析（距离、爬升、基础难度、海拔剖面）, so that 我在填档案前就感受到价值.
6. As a 赶时间的用户, I want to 跳过个人档案用默认模型, so that 我仍能得到一份完整个人报告（带较低置信度）.
7. As a 想要更准结果的用户, I want to 回答四问（经验、舒适距离、舒适爬升、风险偏好）, so that 个人难度真正反映我的水平.
8. As a 有手表/心率习惯的用户, I want to 可选填写年龄、身高、体重、静息心率与负重, so that 生理负荷估计更可信、置信度更高.
9. As a 计划周六出发的用户, I want to 选择出行日期（及可选出发时刻）, so that 天气与日落进入分析和建议.
10. As a 看报告的用户, I want to 并排看到「路线基础难度」和「对你的难度」, so that 我理解个人化到底改变了什么.
11. As a 看报告的用户, I want to 看到 Overall 与 Endurance / Climbing / Weather / Risk 分项, so that 我知道难在哪里.
12. As a 看报告的用户, I want to 看到 0–100 对应的中文档位（轻松/适中/吃力/很难/不建议）, so that 我能快速解读分数.
13. As a 看报告的用户, I want to 看到 Confidence, so that 我知道系统有多有把握.
14. As a 看报告的用户, I want to 看到 Why 贡献项列表（含加减分原因）, so that 分数可解释而非黑盒.
15. As a 看报告的用户, I want to 看到预估时长区间而非单点时间, so that 我不会被假装精确的数字误导.
16. As a 看报告的用户, I want to 看到主要挑战路段（含公里范围）, so that 我能提前规划休息与配速.
17. As a 看报告的用户, I want to 看到推荐出发时刻与预计完成窗口, so that 我能判断是否赶得及天黑前结束.
18. As a 看报告的用户, I want to 看到极简建议饮水量与主风险提示, so that 我能做基本准备.
19. As a 想调整计划的用户, I want to 修改出发时刻并重算完成窗与风险, so that 我能做简单 what-if.
20. As a 看报告的用户, I want to 看到基于学术模型的估算生理强度等级（次要信息）, so that 我能对照生理负荷参考.
21. As a 无网络或天气失败时的用户, I want to 仍能看到完整报告（中性天气假设）, so that Demo 与核心价值不被外部 API 卡住.
22. As a 无 LLM Key 时的用户, I want to 仍能看到中文模板解释, so that 解释能力始终在线.
23. As a 配置了 OpenAI 兼容 API 的开发者/运营, I want to 自动用 LLM 润色解释且不改数字, so that 文案更自然同时保持引擎权威.
24. As a 想传播的用户, I want to 一键复制结构化分享摘要, so that 我能发到小红书或发给朋友.
25. As a 走完线的用户, I want to 回填实际用时与主观难度, so that 为未来 Personal Model 留下数据（本版不自动反训）.
26. As a 回头客, I want to 在本机看到历史分析列表并打开快照, so that 我能对比不同路线.
27. As a 回头客, I want to 对已有路线用当前档案重新分析, so that 档案更新后结果会变.
28. As a 注重隐私的用户, I want to 数据默认只存在本机并可一键清除, so that 我不用注册也能安心用.
29. As a 手机用户, I want to 首屏与报告在窄屏上清晰可读, so that 从小红书点进来也能完成闭环.
30. As a 用户, I want to 在报告页看到简短免责声明, so that 我明白这是辅助判断而非安全保证.
31. As a 产品验证者, I want to 本地记录上传/分析/分享/回填等事件并可导出, so that 我能看 Activation 与二次分析信号而不上报第三方.
32. As a 开发者, I want to 用固定 GPX fixture 锁定引擎行为, so that 相对难度与解析结果不会静默漂移.

---

## Implementation Decisions

### Product & scope

- 品牌：主名 **Outdoor Copilot**，副标题 **个人户外智能**；主文案方向：Know the trail. Know yourself. Go smarter.
- 市场：中国 / 中文 UI / Mobile-first；纯免费，V0.1 不出现付费墙。
- 成功标准：用户感知 Personal Difficulty 有用；同一用户下路线相对排序合理（重于绝对时长精度）。
- 不做：地图、账号、社交、Feed、导航、手表 App、真 ML 反训、全球路线库、装备商城、AI 聊天首页。

### Architecture

- 方案：**模块化客户端引擎**。Next.js App Router 负责页面与两个可选 API 代理；确定性引擎在浏览器运行，并可在 Node 下单测。
- 可选 API：
  - `GET /api/weather` — Open-Meteo 代理；失败则中性 fallback。
  - `POST /api/explain` — OpenAI 兼容接口润色解释；无 Key/失败则客户端模板。
- LLM **禁止**创造或修改难度分、时长、挑战公里段；只基于引擎 JSON 解释。

### Domain modules

- GPX Parser → Route Engine（统计 + 自适应分段 + 海拔序列）→ User Model → Weather → Difficulty Engine → Duration Engine → Challenge Detector → Recommendation Engine → Explanation → Local Store。
- **单一分析入口（测试 seam）：** `analyzeRoute(input) → RouteAnalysis`。

### Personal Difficulty engine (hybrid)

1. **自适应分段**：总距 &lt;6km → ~100m；6–20km → ~250m；&gt;20km → ~500m。
2. **分段负荷** → 基础分项：`endurance` / `climbing` / `weather` / `risk` → `baseOverall`（0–100）。
3. **时长引擎**先估 `moving/total` 与区间；取总时长中位 `t`。
4. **生理负荷层**（参考刘泓舟等《户外运动强度测定与定级》，2022）：用 `r,d,h,m,M,H,t` 估总心跳/储备总心跳；缺省用人群默认；负重默认 5kg 可改；映射进 base 耐力/爬升贡献，并产出次要「估算生理强度等级」。
5. **个人化**：经验、舒适距离/爬升、风险偏好调整各维；可选生理字段提高 confidence。
6. **天气**：Open-Meteo；系数对齐论文量级（如中雨 ×1.2、严重高温低气压 ×1.5 等）并影响 weather/risk/时长。
7. **档位（吃力程度）：** 0–24 轻松 · 25–44 适中 · 45–64 吃力 · 65–84 很难 · 85–100 不建议。
8. **时长区间：** 约 `total×0.90`–`total×1.15`（具体系数实现时可微调，但必须是区间）。
9. **Confidence：** 随档案完整度、生理数据、非 fallback 天气、GPX 质量上升；V0.1 无历史误差校准。

### Data (local)

- IndexedDB 单库；单档案 `UserProfile`（id=`local`）。
- 持久化：`RouteAnalysis` 快照（含当时 profile/weather）、`ActivityFeedback`、`AnalyticsEvent`。
- 示例 GPX 静态放仓库；分析时才写入 Analysis。
- 设置：清除全部本地数据；事件可导出，不上报。

### UX flow

1. Landing → 示例或上传  
2. 基础报告（即时）  
3. 可选个人化（四问 + 可选生理 + 日期/时刻）  
4. 个人报告（对照、分项、Why、建议、解释、分享、回填、出发 what-if）  
5. 历史列表 / 设置  

### Visual

- 户外实地感：地形绿 / 岩灰 / 晨光；全宽英雄氛围；品牌英雄级。
- 避免：紫渐变 AI 风、深色仪表盘堆砌、首屏统计条/多卡片。
- 至少 2–3 处克制动效（如分数计入、剖面绘制）。

### Explanation & share

- 默认中文模板解释；有兼容 LLM 配置时自动润色。
- 分享：复制文字摘要（不做长图导出）。

### Safety

- 报告页固定短免责：辅助判断，不替代经验/向导/现场决策。
- 极端天气在建议区强提示。

---

## Testing Decisions

### What makes a good test

- 只断言 `analyzeRoute` 的**对外行为**与稳定数值属性，不绑定内部函数名、权重表结构或 UI。
- 不测真实 Open-Meteo / LLM 网络；天气与解释在应用层用 stub/fake。
- 允许距离/爬升等地理量的合理数值容差；对单调性/相对关系用硬断言。

### Primary seam

- **唯一引擎测试 seam：`analyzeRoute` → `RouteAnalysis`。**
- UI 以手动/少量关键路径验收为主；V0.1 不强制 E2E 套件。

### Required cases

1. Fixture GPX：距离、爬升、分段数量、最长连续爬升区间在容差内稳定。  
2. 更强档案（更高经验 / 更大舒适区）→ `personalOverall` ≤ 原值。  
3. 高温天气 vs 中性 → `personalOverall` 与 `duration.high` 不降低。  
4. 缺省档案 + fallback 天气仍返回完整 `RouteAnalysis`，且 `confidence` 低于「档案完整 + 真天气」情形。  
5. 挑战路段的公里范围必须落在路线长度内，且与引擎选出的连续爬升等规则一致（非 LLM 编造）。

### Prior art

- Greenfield：无既有测试；以引擎 fixture + 行为测试为起点。

---

## Out of Scope

- 账号 / 登录 / 云同步  
- 地图展示（含高德/Leaflet）  
- 付费墙、Freemium 限额 UI  
- 社交、Feed、评论、Follow  
- 实时导航、语音、手表 App  
- 多日行程规划、「周六去哪」推荐器  
- Strava/Garmin/Apple Health 自动同步  
- 历史活动自动反训 Personal Model  
- 路线对比、全球路线数据库  
- 粘贴 GPX XML（仅文件上传 + 示例）  
- 分享长图/PNG 导出  
- 完整装备清单与商城  
- 多用户档案切换  
- 第三方产品分析上报  

---

## Further Notes

### Academic reference (hybrid layer)

- 刘泓舟, 刘帅, 康明铭, 吕蒙. 户外运动强度测定与定级[J]. 体育科学进展, 2022, 10(3): 371-377.  
  https://www.hanspub.org/journal/PaperInformation?paperID=55411  
- 用作**生理负荷估计层**，不是产品主叙事；主叙事仍是 Personal Difficulty（决策难度）。  
- 论文局限（小样本、有氧、爬楼代理爬升、公式含时间）须在模型说明/免责中诚实体现；规划场景用时长引擎的中位 `t` 代入以避免循环依赖。

### PMF signals to watch (not build analytics cloud)

- Activation：上传/示例后是否完成一次分析  
- 二次分析率  
- 回填实际结果率  
- 复制分享率  
- 访谈：是否觉得比 AllTrails 式固定难度更有用；付费意愿  

### Next process step

- 本 Spec 批准后，使用 **writing-plans** 产出实现计划，再开始脚手架与引擎实现。  
- 当前环境无远程 issue tracker；本文件为权威 Spec。若后续配置 tracker，可将本文同步并标记 `ready-for-agent`。

### Glossary (domain)

| Term | Meaning |
|------|---------|
| Base Difficulty | 与具体用户无关的路线负荷分数 |
| Personal Difficulty | 路线 × 用户能力 × 环境后的吃力程度 |
| RouteAnalysis | 一次分析的完整不可变快照 |
| Segment | 自适应长度的路线子段 |
| Contribution | Why 列表中的可解释加减分项 |
| Physiological intensity | 论文模型估算的生理强度参考，次要展示 |
| Confidence | 模型对本次输出把握程度（非准确率承诺） |

---

## Definition of Done (V0.1)

见用户故事与 Testing Decisions；产品可演示闭环：

**示例或上传 GPX → 基础分析 → 可选档案/天气 → Personal Difficulty 报告 → 解释与建议 → 本地保存 / 分享 / 回填。**
