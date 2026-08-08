# Outdoor Copilot — Data Strategy

**Version:** 1.0  
**Related:** [00-product-vision.md](./00-product-vision.md) · [01-three-month-roadmap.md](./01-three-month-roadmap.md) · [06-metrics.md](./06-metrics.md)

---

## 1. Atomic Unit: OutdoorEvent

More important than Chat UI. Conceptual schema:

```text
OutdoorEvent
├── user
├── route
├── planned_start
├── actual_start
├── planned_duration
├── actual_duration
├── weather
├── route_condition
├── activity_track
├── physiological_data
├── prediction
├── outcome
└── feedback
```

Goal: grow a high-quality **Outdoor Event Graph**.

---

## 2. Data Before AI

Every stored artifact should support at least one of:

- Personal Model improvement  
- Route Intelligence  
- Prediction evaluation  
- Condition freshness  

Do not store chat transcripts as the primary dataset.

---

## 3. Core Entities (v1 direction)

| Entity | Role |
|--------|------|
| User | Identity (later); local-first OK in early web |
| OutdoorProfile | Declared + derived capability |
| Route | Geometry + metrics from GPX |
| RouteSegment | Adaptive segments with grades / effort |
| Analysis | Deterministic scores + drivers |
| Prediction | **Immutable** snapshot of what we predicted |
| Activity | Actual track / duration / completion |
| ActivitySegment | Actual vs predicted by segment |
| WeatherSnapshot | Forecast known at prediction time |
| Feedback | Subjective harder/easier + trust signals |
| ConditionReport | Trail state with TTL |

---

## 4. Prediction Immutability

- Every prediction is persisted once.  
- Algorithm upgrades create **new** predictions; never rewrite history.  
- Enables: predicted vs actual evaluation, model_version comparison.

Required fields on model-derived scores:

- `score`  
- `confidence`  
- `sample_count`  
- `model_version`  

---

## 5. Weather Persistence

Every weather-dependent analysis must store:

- `provider`  
- `forecast_at` (when fetched)  
- `forecast_for` / target timestamp  
- weather snapshot variables  
- model/version if available  

Never rely only on live API responses for evaluation.

**Open-Meteo:** suitable for early prototype (hourly + multi-model). Validate licensing/usage before commercial scale.

---

## 6. Personal Model Evolution

```text
Initial Profile
  → Few Activities → Basic Capability Estimate
  → ~10 Activities → Reliable Personal Model
  → 50+ Activities → Highly Personalized Prediction
```

Do not claim accuracy before enough data. Every capability: score, confidence, sample_count, last_updated.

Early updates: transparent weighted statistics over comparable activities — not black-box ML.

---

## 7. Route Intelligence Evolution

```text
GPX → Geometry → Elevation → Segments → Terrain
  → Difficulty → Conditions → Historical Performance
  → Semantic Trail Knowledge
```

Eventually answer: “Why is **this** 700 m section difficult?”

---

## 8. Environmental / Context Model

```text
Weather + Sun + Temp + Rain + Wind
+ Terrain + Trail Condition + Season
→ Context Model
```

Same trail → different recommendations under different conditions.

---

## 9. Data Sources

### User

- GPX (plan + actual)  
- Activity metrics  
- Wearable (later)  
- Feedback  

### Public

- Terrain / maps  
- Weather  
- Official information  

### Community

- Condition reports  
- Photos  
- Route corrections  

### Experts

- Verification  
- Technical classification  
- Seasonal knowledge  

---

## 10. External Integrations

### Strava

- Permissioned, user-owned data via OAuth  
- Exposes authorized activities/routes; **not** bulk public athlete access  
- Rate limits apply  
- Build “Connect Strava”; do **not** design around scraping  
- **Not** a Week-1 dependency — prove GPX first  

### Apple HealthKit

- Workouts, routes, HR, workout zones (with permission)  
- Strategic path to Watch later  
- After web Prediction ↔ Reality loop works  

---

## 11. Trail Condition Policy

Every report: timestamp, location, source, confidence, expiration.

Suggested TTL defaults (calibrate in ops):

| Condition | TTL |
|-----------|-----|
| Normal | 30 days |
| Mud / water | 7 days |
| Snow | 7 days |
| Blocked | 3 days |
| Safety issue | Until verified |

Stale data must not appear “current.”

---

## 12. Provenance Requirements

Every new data source must declare:

- Provenance  
- Timestamp  
- Permission model  
- Retention policy  

---

## 13. Three-Month Data Targets

| Asset | Target |
|-------|------:|
| Users | 100+ |
| Route analyses | 300+ |
| Completed activities | 100+ |
| Users with repeat activity | 50+ |
| Route segments | 500+ |
| Condition reports | 100+ |

Primary operating metric: **Prediction → Reality feedback rate**.

---

## 14. Prefer Implementations That Grow the Dataset

Prefer simple features that increase the quality and completeness of Outdoor Events over complex ML infrastructure.
