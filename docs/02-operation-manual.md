# Outdoor Copilot — Operations Manual

**Version:** 1.0  
**Purpose:** Establish a repeatable operating system for product growth, data acquisition, community operations, and model improvement.

---

## 1. Operating Principle

Outdoor Copilot is not primarily a content company.

It is a **Data + Product + Community intelligence system**.

```text
Acquire Users
     ↓
Create Value
     ↓
Collect Outdoor Data
     ↓
Improve Product
     ↺
```

Every operation should contribute to this loop.

---

## 2. Operating Pillars

1. User Acquisition  
2. User Activation & Retention  
3. Outdoor Data Acquisition  
4. Trail Expert Network  
5. Product Feedback & Model Improvement  

---

## 3. User Acquisition

**Primary channel:** Xiaohongshu / REDNOTE  

**Secondary:** WeChat communities, hiking communities, Reddit, Strava community, local outdoor groups, hiking clubs  

Do not spread across every channel initially.

---

## 4. Content Strategy

Do **not** primarily advertise: “AI 徒步 App 上线了.”  
Demonstrate a **problem**.

| Category | Example angle |
|----------|----------------|
| A — Personal Difficulty | 同样 10km，为什么有人 3 小时有人 5 小时？Moderate 对你真的 Moderate 吗？ |
| B — Prediction | AI 预测 5 小时，实际用了多久？（Prediction → Reality content） |
| C — Personalization | 5 个人同一条线，AI 难度完全不同 |
| D — Trail Intelligence | 真正难的不是爬升，而是最后 2km |
| E — Outdoor Data | 一条 GPX 到底能告诉你什么？ |

---

## 5. Content Production SOP

| Day | Action |
|-----|--------|
| Monday | Choose one outdoor problem |
| Tuesday | Run analysis / collect data |
| Wednesday | Create content |
| Thursday | Publish |
| Friday | Collect comments |
| Weekend | Ask users to test the product |

---

## 6. Content Format

```text
Problem → Real Example → Data → AI Analysis → Unexpected Insight → CTA
```

CTA example: 上传你的 GPX，看看它对你到底有多难。

---

## 7. Acquisition Funnel

```text
Content → Landing → Analyze → Upload GPX → Personal Profile → Analysis
  → Save → Hike → Upload Actual Track → Prediction vs Reality → Return
```

Track every step (see [06-metrics.md](./06-metrics.md)).

---

## 8. Activation Definition

| Stage | Definition |
|-------|------------|
| **Activated** | Upload GPX + receive Personal Analysis |
| **High-value** | Analysis + Actual Activity Feedback |
| **Core** | Completes the cycle at least twice |

---

## 9. User Interview SOP

Every week: **3–5** active hikers.

Do **not** ask “Do you like my product?”

Ask about the last time they decided whether to hike a route: what they looked at, worries, what they got wrong, what happened — then show Outdoor Copilot and ask whether it would have changed the decision.

---

## 10. Feedback Classification

Every feedback: `BUG` | `CONFUSION` | `MISSING DATA` | `WRONG PREDICTION` | `MISSING FEATURE` | `TRUST ISSUE` | `VALUE ISSUE`

Do not treat every request as a feature request.

---

## 11. Data Acquisition Strategy

| Source | Priority | Notes |
|--------|----------|-------|
| 1. User GPX | Highest | Generate Route / Activity / Segment where possible |
| 2. Actual Activity | Highest value | Encourage post-hike GPX |
| 3. Trail Condition Reports | High | ≤10 seconds to report |
| 4. Expert Verification | High quality | Terrain, technicality, seasonality |

See [03-data-strategy.md](./03-data-strategy.md).

---

## 12. Trail Condition Data Policy

Every report needs: timestamp, location, source, confidence, expiration.

**Never present stale data as current.**

Suggested TTL defaults (calibrate later):

| Condition | TTL |
|-----------|-----|
| Normal | 30 days |
| Mud / water | 7 days |
| Snow | 7 days |
| Blocked | 3 days |
| Safety issue | Until verified |

---

## 13–16. Trail Expert Program

**Start city:** Beijing (density + route diversity).

Optimize for **data quality**, not follower count.

**Levels:** Explorer → Contributor (5+) → Trail Expert (20+) → Regional Expert (100+)

**Early incentives:** free Pro, badge, ranking, attribution, early access, product influence.  
Later: revenue share, paid verification, guide tools, B2B.

Do not pay for raw uploads. Pay for **verified, high-value information**.

---

## 17. Route Verification Workflow

```text
New Route → Automatic Analysis → Community Feedback → Expert Review
  → Verified → Periodic Re-evaluation
```

Every route: Verification Status, Last Verified, Confidence.

---

## 18. Route Knowledge Lifecycle

```text
Created → Analyzed → Observed → Verified → Updated
  → Potentially Stale → Revalidated
```

A route is never “finished.”

---

## 19. Weekly Operations Meeting

Review: Product (activation, retention, prediction accuracy, bugs) · Data (GPX, activities, conditions, verified routes) · Growth (traffic, conversion, content) · Users (interviews, complaints, churn).

---

## 20. Weekly Dashboard

Visitors, Signups, GPX Uploads, Analyses, Completed Activities, Actual GPX Uploads, Prediction Feedback, Repeat Users, Active Experts, Condition Reports — and **Prediction Accuracy**.

---

## 21. North Star Metrics

**Primary:** Verified Outdoor Events (Route + User + Date + Actual Activity + Outcome)

**Secondary:** Personalization rate · Median absolute prediction error · 30-day repeat analysis · % contributing actual activity data

Full definitions: [06-metrics.md](./06-metrics.md).

---

## 22. Growth Loop

```text
Content → User → Analysis → Hike → Actual Data
  → Better Model → Better Result → Share → Content
```

---

## 23. What NOT to Do

Fake followers/reviews · scrape private data · incentivize meaningless GPX · fake trail conditions · claim scientific/medical accuracy · spam groups · generic AI chatbot · chase every feature request.

**Quality of data > quantity.**

---

## 24. Launch Strategy

| Phase | Scale | Goal |
|-------|------:|------|
| 1 | 20 experienced hikers | Find product failures |
| 2 | 100 users | Validate repeat usage |
| 3 | 500 users | Validate data flywheel |
| 4 | Public beta | Test organic acquisition |

---

## 25. User Referral Mechanism

After analysis: shareable personal difficulty report → CTA “Analyze your own route.”

---

## 26. Monetization Operations

Do not charge immediately. Identify repeated value first.

Candidates later: unlimited analysis, historical personal model, advanced comparison, trip planning, what-if, advanced weather, multi-day planning.

---

## 27. Incident Management

If potentially dangerous advice:

1. Disable affected recommendation  
2. Log input  
3. Root cause  
4. Regression test  
5. Correct model  
6. Communicate limitations  

Never replace authorities, professional guides, emergency services, or official closures.

---

## 28. Operational Principle

Get better every week at answering:

> What actually happens when this person walks this trail?

Every user, route, and activity should improve that answer.
