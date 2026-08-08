# Week 1–2 Execution Plan（已对齐）

**Date locked:** 2026-08-08  
**Supersedes:** informal grilling draft that prioritized viz-over-prediction  
**North star (near term):** 验证「用户是否愿意在徒步前知道：这条线对我意味着什么？」并开始积累 **Prediction** 数据。

---

## 与 grilling 的对齐说明

| 议题 | 原 grilling | 本次对齐后 |
|------|-------------|------------|
| 本周主目标 | 偏 Week 2 剖面体验 | **本周 = 预测可保存的数据骨架**；剖面放下周 |
| 算法 | 冻结 | **冻结**（打 baseline tag） |
| 存储 | localStorage + 字段清单 | 仍可本机先行，但模型上 **Prediction 独立实体**，禁止塞进 Analysis 后覆盖 |
| Profile | 已有四问 | 补齐轻量 Profile；**Profile ≠ Personal Model**（schema 分开） |
| Terrain | 坡度规则 | **先不做地形识别**；Segment 用 GPX 几何指标即可 |
| 难度剖面 UI | 本周就做 | **下周**做 Difficulty Profile |
| 邀请试用 | 10–20 人 | 本周先能 Save Prediction；名单可同步准备，大规模试用可跟剖面一起 |

---

## 本周｜Week 1 — 产品化 + 数据化

### 唯一目标

把 `/analyze` 从 Demo 变成能开始积累真实用户数据的 **v0.2 骨架**：  
**GPX → Profile → Analysis → Prediction（保存）**。

### 1. 冻结 baseline

- Tag：`v0.1-analyze`（仓库已有 `v0.1.0`，再打此 tag 作分析基线别名亦可）
- 截图当前关键页面
- 清单：已有功能 / 输入 / 输出 / 局限
- **不改**核心难度/时长算法（保留可比 baseline）

### 2. 核心数据模型（最重要）

实体：`User` · `OutdoorProfile` · `Route` · `RouteSegment` · `Analysis` · **`Prediction`** · `Activity` · `Outcome` · `Feedback`

关系（逻辑）：

```text
User
 ├── OutdoorProfile          ← 用户自称（声明式）
 └── Activity
      └── Route
           ├── RouteSegment
           └── Analysis
                └── Prediction   ← 独立、不可变快照
                       ↓
                    Outcome      ← 日后实际结果（本周可只留类型/空壳）
```

**硬规则：** Prediction 必须独立保存；禁止「改 Analysis 覆盖旧预测」。

实现可先本机（IndexedDB/localStorage 按实体分 key），但类型与 ID 关系按上图来，方便 Week 3+ 上库。

### 3. `/analyze` 流程改成「保存预测」

```text
上传 GPX → 填写/选择 Profile → 分析 → 保存这次 Prediction
```

结果页明确 **Your Prediction**：

- Personal Difficulty（分 + 档）
- Estimated time（区间）
- Confidence

CTA：`Save this prediction`（中文可用「保存这次预测」）

为两周后按钮预留文案位（可先禁用或仅文案）：

```text
I’m hiking this → After hike: Compare prediction with reality
```

### 4. 最简 OutdoorProfile（声明式）

第一版字段：身高、体重、年龄、徒步经验、最近一次徒步、典型距离、典型爬升；（已有 HR 可保留）

**Profile ≠ Personal Model** —— Personal Model 本周不建学习逻辑，只在 schema/文档里占位。

### 5. Analytics（本周起）

至少：`landing_view` · `upload_gpx` · `analysis_started` · `analysis_completed` · `prediction_created` · `prediction_saved`

### 6. 本周明确不做

AI Chat · Strava · Watch · 社区 · Trail Expert · 推荐 · Route Discovery · 复杂 ML · Native App · **难度剖面大 UI（放到下周）** · 改主算法

### 本周完成定义

- [x] baseline 已 tag（`v0.1-analyze`）+ 清单 `docs/baseline/v0.1-analyze.md`  
- [x] 九类实体类型与 Prediction 独立持久化（`src/domain`）  
- [x] 用户能走完「分析 → 保存预测」并在 `/history` 看到预测快照  
- [x] 漏斗事件可导出核对（含 `landing_view` / `prediction_saved` 等）  

---

## 下周｜Week 2 — Route Intelligence

### 唯一目标

路线不再是「一根线」，而是 **分段可解释的 Route Intelligence**。

### 1. GPX → RouteSegments

自适应分段；每段至少：distance · elevation_gain/loss · average_grade · max_grade · **estimated_effort**  
展示形态：Easy / Hard Climb / Moderate / Descent 等 **标签可从 grade/effort 规则映射**，不做外部 DEM/地形识别。

- [x] `estimatedEffort` + `effortLabel` on engine `Segment`（几何规则，不改 overall 公式）

### 2. Route Difficulty Profile UI

在 Overall 分之外，公里轴上的 effort 剖面，让用户一眼看到「真正难的是 3–6 km」。

- [x] `DifficultyProfile` + 最难段 callout（base / personal 报告均展示）

### 3. AI 最多一层

结构化 Segment（含最难段）→ LLM **只解释**为什么该段最难。不发明数字。

- [x] `/api/explain` `mode=hardest_segment`（个人报告可选 LLM；失败回落模板）

### 4. 产品假设验证

两周后应能支撑：

上传 → Profile → 看预测（含剖面）→ 保存 →（预留）徒步 → 回来对比  

验证的不是技术炫技，而是：

> 用户是否愿意在徒步前搞清楚「这条线对我意味着什么」？

---

## 五周节奏（提醒，本周不展开做）

| 时间 | 核心 | 结果 |
|------|------|------|
| 本周 | 数据模型 + Prediction + Profile | 能记录「预测」 |
| 下周 | Segmentation + Difficulty Profile | 理解路线阶段 |
| 第 3 周 | Actual GPX | 现实结果 |
| 第 4 周 | Prediction vs Reality | 第一个数据闭环 |
| 第 5–6 周 | Personal Model | 开始认识用户 |

---

## 一句话

**这周把 Prediction 存下来。下周把 GPX 拆成 RouteSegment。**  
这两个立住，Outdoor Copilot 的架构才立住。
