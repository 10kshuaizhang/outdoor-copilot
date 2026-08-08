# Outdoor Copilot — Metrics

**Version:** 1.0  
**Related:** [01-three-month-roadmap.md](./01-three-month-roadmap.md) · [02-operation-manual.md](./02-operation-manual.md)

---

## 1. North Star

### Primary — Verified Outdoor Events

An event is valuable when all exist:

```text
Route + User + Date + Actual Activity + Outcome
```

Operational focus: grow this count with **quality**, not spam uploads.

### Leading indicator (12-week)

**Prediction → Reality feedback rate**

```text
users_with_prediction_and_actual_feedback
  / users_with_at_least_one_analysis
```

---

## 2. Funnel Metrics

Track end-to-end:

```text
Landing
→ Upload / Sample
→ Profile
→ Analysis
→ Save
→ Hike
→ Actual Upload
→ Feedback
→ Repeat
```

| Step | Metric |
|------|--------|
| Landing | Visitors / sessions |
| Analyze start | `/analyze` entries |
| GPX / sample | Upload or sample runs |
| Profile | Profile complete vs skip |
| Analysis | Personal analyses completed |
| Save | History saves (or cloud later) |
| Actual | Actual duration / GPX after hike |
| Feedback | Subjective harder/easier |
| Repeat | Second analysis or second activity |

V0.1 local analytics: `src/lib/analytics/events.ts` (exportable JSON). Graduate to server analytics as accounts appear.

---

## 3. Activation & Retention

| Label | Definition |
|-------|------------|
| Activated | GPX/sample + Personal Analysis |
| High-value | Analysis + Actual Activity Feedback |
| Core | Full cycle ≥ 2 times |
| Repeat analysis (30d) | ≥2 analyses in 30 days |

**Breakout signal:** ≥30% of users who complete one analysis return with another route or activity.

---

## 4. Prediction Quality

| Metric | Definition |
|--------|------------|
| Coverage | % analyses with stored immutable Prediction |
| Feedback rate | % predictions with actual duration or GPX |
| Median Abs % Error | median(\|actual − predicted_mid\| / predicted_mid) |
| Bias | mean(actual − predicted_mid) |
| Subjective match | Distribution of harder/easier Likert |

Never overwrite historical predictions when measuring these.

---

## 5. Personalization

| Metric | Definition |
|--------|------------|
| Profile completeness | % analyses with non-default profile |
| History-aware rate | % analyses using prior activities (post Personal Model) |
| Capability confidence | Distribution of confidence by capability |

---

## 6. Data Contribution

| Metric | Target (12 weeks) |
|--------|------------------:|
| Users | 100+ (min) / 500 (strong) |
| Analyses | 300+ / 1,000 |
| Completed activity feedbacks | 100+ / 300 |
| Repeat users | 30 / 100 |
| Users with repeated activity data | 50+ |
| Route segments | 500+ |
| Condition reports | 100+ |

---

## 7. Weekly Dashboard (Ops)

- Visitors / Signups (when auth exists)  
- GPX Uploads  
- Analyses  
- Completed Activities  
- Actual GPX Uploads  
- Prediction Feedback  
- Repeat Users  
- Active Experts  
- Condition Reports  
- **Prediction Accuracy** (median abs % error)  

---

## 8. Feature Scorecard (Before Building)

Score 0–5 (complexity −5–0):

| Question | Score |
|----------|------:|
| Improves Personal Model? | 0–5 |
| Improves Route Intelligence? | 0–5 |
| Generates useful data? | 0–5 |
| Improves prediction? | 0–5 |
| Improves retention? | 0–5 |
| Monetization potential? | 0–5 |
| Engineering complexity | −5–0 |

Build highest **Strategic Value / Engineering Cost**. If a feature answers none of the five roadmap questions in [01](./01-three-month-roadmap.md) §8 — do not build.

---

## 9. PMF Interview Signals (Week 12)

Qualitative, but log systematically:

1. Expected vs useful  
2. Trust / distrust  
3. Pre-hike use intent  
4. Willingness to upload another activity  
5. Willingness to pay  
6. Comparison products  

Target: **20** active hiker interviews.
