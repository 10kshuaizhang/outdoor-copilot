# Outdoor Copilot — Product Vision

**Version:** 1.0  
**Product:** Outdoor Copilot（个人户外智能）

---

## 1. Core Thesis

Outdoor Copilot is **not** an AI hiking chatbot.

It is:

> A personal intelligence layer between a person, a trail, and the real world.

Three knowledge systems:

```text
YOU
 │
 │ Personal Model
 │
 ▼
AI
 │
 ├───────────────┐
 │               │
 ▼               ▼
TRAIL        CONDITIONS
 │               │
Route Model   Environment Model
```

---

## 2. What We Are Building

**Prove that Outdoor Copilot can:**

1. Predict how a route will feel for a **specific person**
2. Compare prediction against **reality**
3. Improve the **personal model** over time

**Brand promise:**

> Know yourself. Know the trail. Go smarter.  
> 先看清这条路对你有多难。

**Mantra:**

> Predict. Hike. Learn. Improve.

---

## 3. What We Are NOT Building (Near Term)

- A complete hiking app
- A social network (feed / follow / comments)
- A generic AI chatbot
- A navigation app
- A global trail database
- A marketplace or ads surface
- Native mobile as a Week-1 dependency

Web is sufficient until native unlocks data acquisition or real-time value.

---

## 4. The Moat (Weakest → Strongest)

```text
AI Prompt
     ↓
AI Explanation
     ↓
Difficulty Algorithm
     ↓
Route Intelligence
     ↓
Behavioral Data
     ↓
Personal Outdoor Model
     ↓
Personal Model + Real-world Outcomes
```

The durable moat is:

> Knowing how a **specific person** actually performs in **specific conditions** on **specific terrain**.

---

## 5. Competitive Positioning

| Product | Question it answers |
|---------|---------------------|
| AllTrails-class | Where is the trail? |
| Strava-class | How did people perform? |
| **Outdoor Copilot** | **How will YOU perform?** |

Do not compete on route inventory or prettier AI prose. Compete on **personalized prediction and decision intelligence**.

---

## 6. What Success Feels Like

The user says: “I want to hike this Saturday.”

Outdoor Copilot answers with structured judgment, for example:

> Based on your recent performance, this route is appropriate. Start before 8:00 because temperatures rise after 11:00. The biggest challenge is the 4.8 km sustained climb. You are likely to slow down ~12–15% there based on your last three similar activities.

Not: “Here is a beautiful AI-generated hiking guide.”

---

## 7. North Star Question

> Can Outdoor Copilot predict and improve a person’s real-world outdoor experience?

- If **yes** → build more.  
- If **no** → do not add features.

---

## 8. Near-Term Strategic Priority (Next 12 Weeks)

1. Personal Difficulty  
2. Prediction  
3. Actual Activity  
4. Prediction vs Reality  
5. Personal Model  
6. Trail Conditions  
7. AI Explanation  

Everything else is secondary. See [01-three-month-roadmap.md](./01-three-month-roadmap.md).

---

## 9. Related Docs

- [01 — Three-Month Roadmap](./01-three-month-roadmap.md)
- [03 — Data Strategy](./03-data-strategy.md)
- [04 — AI Architecture](./04-ai-architecture.md)
- [06 — Metrics](./06-metrics.md)
- Spec (V0.1): [superpowers/specs/2026-08-08-outdoor-copilot-v01-design.md](./superpowers/specs/2026-08-08-outdoor-copilot-v01-design.md)
