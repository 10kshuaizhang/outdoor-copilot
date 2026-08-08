# Outdoor Copilot — Decision Log

**Version:** 1.0  
**Purpose:** Record non-obvious product and engineering decisions (ADR-style). Newest first within each section.

Format per entry:

- **Date**
- **Decision**
- **Context**
- **Consequences**
- **Status:** `active` | `superseded`

---

## Product & Scope

### D-040 — Week 1–2 = Prediction skeleton, then Route Intelligence

- **Date:** 2026-08-08  
- **Decision:** Near-term execution prioritizes **saving immutable Predictions** (Week 1) before Difficulty Profile UI (Week 2). Aligns 12-week roadmap with “predict → hike → actual → learn”. See [07-week-1-2-execution.md](./07-week-1-2-execution.md).  
- **Context:** Grill draft had leaned viz-first; product correction: without stored Prediction there is no baseline for later accuracy.  
- **Consequences:** Freeze scoring algorithm as `v0.1-analyze` baseline; Profile ≠ Personal Model in schema; no chat/Strava/Watch/social; terrain recognition deferred.  
- **Status:** active  

### D-001 — Personal Route Intelligence first, not trail encyclopedia

- **Date:** 2026-08-08  
- **Decision:** V0.1 validates Personal Difficulty (person × trail × environment), not a maintained global route DB.  
- **Context:** Competing on route inventory loses to AllTrails-class products; moat is personal outcomes.  
- **Consequences:** User GPX / samples are source of truth; route library deferred.  
- **Status:** active  

### D-002 — Mobile web first; mini-program / native later

- **Date:** 2026-08-08  
- **Decision:** Ship mobile-first web (PWA-ready); WeChat mini-program and native only when they unlock acquisition or sensors.  
- **Context:** 12-week roadmap forbids premature mobile.  
- **Consequences:** Share UX optimized for Xiaohongshu (image card + caption).  
- **Status:** active  

### D-003 — No social, navigation, marketplace in V0.1 / 12 weeks

- **Date:** 2026-08-08  
- **Decision:** Explicitly out of scope unless demand-validated later.  
- **Status:** active  

---

## Architecture

### D-010 — Modular client-side engine + Next.js

- **Date:** 2026-08-08  
- **Decision:** Deterministic engine runs in browser (and Node tests); Next.js App Router for UI + thin API proxies.  
- **Context:** Approach A from grill-me; single test seam `analyzeRoute`.  
- **Consequences:** Fast demo without auth/backend; later migrate Outdoor Events to DB per roadmap Week 1.  
- **Status:** active  

### D-011 — LLM explains only

- **Date:** 2026-08-08  
- **Decision:** Scores, duration, challenge km come only from deterministic code; LLM may polish Chinese explanation.  
- **Consequences:** `/api/explain` cannot invent numbers; template fallback always available.  
- **Status:** active  

### D-012 — Open-Meteo for weather

- **Date:** 2026-08-08  
- **Decision:** Proxy Open-Meteo; on failure use neutral fallback so reports still ship.  
- **Consequences:** Persist snapshot fields for evaluation; validate commercial terms before scale.  
- **Status:** active  

### D-013 — Local-first storage in V0.1

- **Date:** 2026-08-08  
- **Decision:** History / profile / events in browser storage (no account).  
- **Context:** Spec mentioned IndexedDB; implemented localStorage with save-failure messaging.  
- **Consequences:** Must migrate to server Outdoor Event store for Prediction immutability & multi-device (roadmap).  
- **Status:** active (interim)  

---

## Difficulty & Calibration

### D-020 — Hybrid Personal Difficulty with physiology as secondary layer

- **Date:** 2026-08-08  
- **Decision:** Base + weather + optional physiology (刘泓舟等) + personalization; physiology is reference, not primary narrative.  
- **Status:** active  

### D-021 — Soften climbing saturation (2026-08-08)

- **Date:** 2026-08-08  
- **Decision:** Reduce continuous-climb coefficient / cap run length; widen mid bands so Beijing day-hikes (~8–12 km, 500–800 m) land 适中–偏吃力 for intermediate profiles.  
- **Context:** Users reported “还好的线” labeled too hard; climbing often hit 100.  
- **Consequences:** Documented in `docs/DIFFICULTY.md`; historical local scores need re-analyze.  
- **Status:** active  

### D-022 — Persist LLM explanation into history

- **Date:** 2026-08-08  
- **Decision:** After `/api/explain`, patch local history; backfill on history open if template-only.  
- **Context:** Reopening history dropped AI copy because save happened before LLM returned.  
- **Status:** active  

---

## Go-to-Market

### D-030 — Xiaohongshu as primary acquisition

- **Date:** 2026-08-08  
- **Decision:** Primary ops channel = Xiaohongshu; share artifact = 3:4 poster + caption, not text-only.  
- **Status:** active  

### D-031 — Freemium later; V0.1 pure free

- **Date:** 2026-08-08  
- **Decision:** No paywall until repeat value is demonstrated.  
- **Status:** active  

---

## How to Add Entries

When a decision changes product shape, architecture, or trust boundaries:

1. Add a new `D-xxx` at the top of the relevant section.  
2. Mark superseded entries `Status: superseded by D-xxx`.  
3. Link from PRs / tickets when useful.  
