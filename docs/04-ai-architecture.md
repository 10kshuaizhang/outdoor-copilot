# Outdoor Copilot — AI Architecture

**Version:** 1.0  
**Related:** [00-product-vision.md](./00-product-vision.md) · [03-data-strategy.md](./03-data-strategy.md)

---

## 1. Hard Rule

**Deterministic calculations must never depend on LLM output.**

LLM must not independently invent or overwrite:

- distance, elevation  
- duration ranges  
- difficulty / risk scores  
- weather values  
- challenge kilometer ranges  

LLM **explains and plans around** computed structured results.

Current V0.1 seam: `analyzeRoute` → numbers; `/api/explain` → optional polish only.

---

## 2. Layered Architecture

```text
                 LLM
                  │
         ┌────────┴────────┐
         │                 │
    Explanation       Conversation
         │                 │
         └────────┬────────┘
                  ↓
           Decision Engine
                  ↓
     ┌────────────┼────────────┐
     ↓            ↓            ↓
   User         Route       Environment
   Model        Model          Model
```

LLM should call **tools** rather than invent facts.

---

## 3. Intended Tools (Direction)

| Tool | Purpose |
|------|---------|
| `get_user_profile()` | Personal Outdoor Profile + capabilities |
| `get_route_analysis()` | Deterministic Route Intelligence |
| `get_weather()` | Stored / live WeatherSnapshot |
| `get_activity_history()` | Past OutdoorEvents |
| `simulate_scenario()` | What-if (start time, pack, pace) |
| `compare_routes()` | Relative suitability |

---

## 4. Where AI Creates Value (Week 11+)

Given structured inputs (profile, route, prediction, weather, history, conditions), AI may generate:

1. **Explanation** — Why is this hard for me?  
2. **Recommendation** — When should I start?  
3. **What-if** — Start two hours later?  
4. **Comparison** — Which of these two suits me better?  

Still: **no invented numbers.**

---

## 5. Anti-Patterns

| Anti-pattern | Why forbidden |
|--------------|----------------|
| Generic AI chat home | Bypasses data loop |
| LLM-computed difficulty | Non-reproducible, unsafe trust |
| Content farm of AI trail articles | Weak moat |
| Chat without tools | Hallucinated outdoors advice |

---

## 6. Simulation (Longer-Term)

Killer feature direction: **What-if Outdoor Simulation**

Examples: start 7 vs 9 · +5 kg pack · +5°C · 10% slower · alternate / shortened route  

Simulate: start time, weather, sunlight, expected pace, fatigue, finish window — grounded in Decision Engine outputs.

---

## 7. Model Metadata

Any model-touched score in product surfaces should expose:

- `score`  
- `confidence`  
- `sample_count`  
- `model_version`  

LLM responses should cite which structured fields they used (for debugging and trust).

---

## 8. Current Implementation Notes (V0.1)

| Piece | Status |
|-------|--------|
| Deterministic engine | `src/lib/engine` (`analyzeRoute` seam) |
| Weather | Open-Meteo via `/api/weather` + snapshot on analysis |
| Explanation | OpenAI-compatible `/api/explain`; template fallback |
| Persistence | Browser localStorage history (no cloud user DB yet) |

Roadmap moves toward server-side Outdoor Event store + immutable Prediction records — see [01-three-month-roadmap.md](./01-three-month-roadmap.md).
