# Outdoor Copilot — 12-Week Product & Engineering Roadmap

**Version:** 1.0  
**Duration:** 12 weeks  
**Product:** Outdoor Copilot  
**Current State:** GPX Route Analysis MVP exists at `/analyze`  
**Primary Objective:** Build the first closed-loop Personal Outdoor Intelligence system.

---

## 0. Three-Month North Star

The goal is **NOT**:

- Build a complete hiking app
- Build a social network
- Build an AI chatbot
- Build a navigation app
- Build a route database
- Build a mobile app immediately

The goal **IS**:

Prove that Outdoor Copilot can predict how a route will feel for a specific person, compare the prediction against reality, and improve the personal model over time.

### Core loop (primary flywheel)

```text
Route
  ↓
Personal Analysis
  ↓
Prediction
  ↓
User Hikes
  ↓
Actual Activity
  ↓
Prediction vs Reality
  ↓
Personal Model Update
  ↓
Better Prediction
  ↓
Better Recommendation
  ↺
```

---

## 1. Three-Month Objectives

By the end of Week 12:

### Product

- GPX upload
- Route parsing
- Route segmentation
- Personal Outdoor Profile
- Personal Difficulty
- Duration prediction
- Weather-aware analysis
- Route comparison
- Prediction vs Reality
- Activity import
- Personal Model
- Route condition feedback
- Basic AI explanation
- Basic recommendation

### Data targets (not vanity)

| Target | Count |
|--------|------:|
| Users | 100+ |
| Route analyses | 300+ |
| Completed activities | 100+ |
| Users with repeated activity data | 50+ |
| Route segments | 500+ |
| Route-condition reports | 100+ |

**Most important metric:** Prediction → Reality feedback rate  
See [06-metrics.md](./06-metrics.md).

---

## 2. Development Philosophy

### Principle 1 — Data Before AI

Do not add AI features that do not generate or consume structured data.

Bad: `User → ChatGPT → answer`  
Good: `User → Structured Outdoor Data → Decision Engine → LLM → Explanation`

### Principle 2 — Deterministic Core

All important numbers must come from deterministic code.

LLM must **not** independently calculate: distance, elevation, duration, difficulty, risk score, weather values.

LLM **explains** computed results.

### Principle 3 — Build the Feedback Loop Early

Do not wait until Month 3 to collect actual activity data.  
Prediction vs Reality should exist by **Week 5–6**.

### Principle 4 — Avoid Premature Mobile Development

Web is sufficient for the first 12 weeks.  
Native iOS only when it unlocks data acquisition or real-time value.

---

## 3. Week-by-Week Roadmap

### WEEK 1 — Product Baseline & Technical Foundation

**Objective:** Turn the existing prototype into a stable product foundation.

**Product**

- Audit `/analyze`
- Document: current user flow, inputs, outputs, calculation logic, data sources, limitations
- Create: Product Contract, Data Contract, API Contract, Calculation Contract

**Engineering — domain modules**

```text
/domain
  /route
  /user
  /activity
  /weather
  /analysis
  /prediction
```

**Entities:** User, OutdoorProfile, Route, RouteSegment, Analysis, Activity, ActivitySegment, WeatherSnapshot, Prediction, Feedback

**Deliverables**

- Stable GPX parser
- Route object / Analysis object
- Database schema v1
- Calculation engine interface
- Automated tests for route calculations

**Do NOT build:** AI chat, social feed, mobile app, route discovery

---

### WEEK 2 — Route Intelligence

**Objective:** Transform GPX from a file into a structured Route Intelligence object.

**Build**

- Metrics: distance, elevation gain/loss, max/min elevation, grade distribution, moving vs total where available
- Adaptive segments (~250–500 m): distance, elevation_gain/loss, average_grade, max_grade, estimated_effort, terrain
- Visualization: Elevation Profile + Difficulty Profile (“Where will this become difficult?”)

**Deliverable:** Structured Route Object + Segment Graph (not “just a GPX file”)

---

### WEEK 3 — Personal Outdoor Profile

**Objective:** Create persistent user capability.

**Profile fields (initial):** Age, Height, Weight, Resting HR, Max HR, Hiking Experience, Typical Distance / Elevation / Duration, Risk Preference

**Capability model:** Endurance, Climbing, Descending, Technical Terrain, Long Duration, Heat Sensitivity, Cold Sensitivity, Pacing

Each capability: `score`, `confidence`, `data_points`, `last_updated`

Label as **product-derived estimates** — not medical/scientific validation.

---

### WEEK 4 — Personal Difficulty Engine v1

**Objective:** Upgrade difficulty into Personal Difficulty.

**Conceptual formula**

```text
Base Route Difficulty
  × Personal Capability Adjustment
  × Environmental Adjustment
  × Historical Performance Adjustment
```

**Output dimensions:** Overall, Endurance, Climbing, Descending, Technical, Weather  

Every result: Score + Confidence + Main Drivers  

**Deliverable:** Users can answer “Why is this route hard for me?”

---

### WEEK 5 — Prediction Engine

**Objective:** Predict actual duration and effort as ranges + confidence.

Example:

```text
Estimated Moving Time: 4h20m–4h50m
Estimated Total Time:  4h45m–5h30m
Confidence: Medium
```

**Inputs:** Route, distance, elevation, grade distribution, personal profile, historical activities, weather, start time

**Critical:** Predictions are **immutable** once stored. Algorithm changes must not overwrite historical predictions (enables evaluation).

---

### WEEK 6 — Prediction vs Reality

**Objective:** Close the first data loop.

After hike: GPX upload and/or manual actual duration + completion status.

Compare Predicted vs Actual (error %, quality label).

Subjective: Was this harder than expected? (5-point scale)

---

### WEEK 7 — Activity Intelligence

**Objective:** Understand how users actually move.

Parse activity: distance, elevation, moving/elapsed time, pace, stops, speed changes, route deviation.

Segment-level predicted vs actual pace; generate insights like “performance dropped primarily during sustained climbing.”

---

### WEEK 8 — Personal Model v1

**Objective:** Learn from user history with transparent weighted statistics (no black-box ML yet).

Update capabilities from comparable activities; keep score / confidence / sample counts debuggable.

---

### WEEK 9 — Weather & Environmental Intelligence

**Objective:** Route + User + Conditions.

Inputs: temperature, apparent temperature, precipitation, wind, humidity, sunrise, sunset (Open-Meteo for prototype; validate licensing for commercial scale).

Outputs as explainable categories: Heat / Rain / Wind Impact, Daylight Constraint — not fake scientific precision.

---

### WEEK 10 — Trail Condition Intelligence

**Objective:** Collect real-world trail state (Normal / Muddy / Wet / Snow / Blocked / Poor signage / Difficult navigation / Other).

Optional photo, note, timestamp, segment. Each report: created_at, confidence, source, expiration. **Conditions must decay.**

---

### WEEK 11 — AI Explanation & Planning

AI receives structured results only; generates Explanation / Recommendation / What-if / Comparison.

**AI cannot invent numerical values.** See [04-ai-architecture.md](./04-ai-architecture.md).

---

### WEEK 12 — Productization & PMF Test

Landing, onboarding, profile, analysis, history, prediction vs reality, activity feedback, route report, shareable result.

Funnel analytics + **20 PMF interviews** with active hikers (expectation, usefulness, trust, pre-hike use, upload again, indispensability, willingness to pay, comparison products).

---

## 4. Three-Month Success Criteria

| Level | Users | Analyses | Completed activity feedbacks | Repeat users |
|-------|------:|---------:|-----------------------------:|-------------:|
| Minimum | 100 | 300 | 100 | 30 |
| Strong | 500 | 1,000 | 300 | 100 |

**Breakout signal**

- ≥30% of users who complete one analysis return with another route or activity
- Users say the product is useful because it understands **their** ability, not just trail labels

---

## 5. What NOT to Build During These 12 Weeks

Unless validated by demand: social feed, followers, comments, messaging, marketplace, ads, route booking, full navigation, live voice assistant, Apple Watch full app, global trail database, complex ML infrastructure.

**Data Flywheel > Feature Count**

---

## 6. Architecture Direction

```text
Web
 │
 API
 │
 ├── Route Intelligence
 ├── Personal Model
 ├── Prediction Engine
 ├── Weather Intelligence
 ├── Trail Condition
 ├── Activity Analysis
 └── AI Explanation
 │
 Database
 │
 └── Outdoor Event Graph
```

---

## 7. Future Data Integrations

- **Strava:** user-authorized data source (OAuth), not bulk public scraping. Not a Week-1 dependency.
- **Apple HealthKit:** strategically important later (workouts, routes, HR, zones). After web data loop works.
- **First prove the product with GPX.**

---

## 8. Final Rule

Every new feature must answer at least one:

1. Does it improve Personal Model?  
2. Does it improve Route Intelligence?  
3. Does it improve Prediction Accuracy?  
4. Does it increase useful activity data?  
5. Does it increase repeat usage?  

If not: **do not build it yet.**
