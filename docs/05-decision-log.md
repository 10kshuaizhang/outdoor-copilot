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

### D-041 — Moss & Dawn Refined（原色调 + 精致版式，无粉色）

- **Date:** 2026-08-11  
- **Decision:** Keep original **moss / cream / gold** tokens. Retain refined UI (atmosphere, panels, score hero, share panel placement, Cormorant + Raleway). **Reject** dusty-rose / pink CTA from the earlier Alpine Dawn experiment.  
- **Context:** Share-first polish is valuable, but cool-teal + pink drifted from Outdoor Copilot’s outdoor identity; product owner preferred a compromise without pink.  
- **Consequences:** `--cta` remains `#c4a574`; hero/share/OG use warm moss greens; no pink accents in CSS, share PNG, or marketing surfaces.  
- **Status:** active  

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

### D-029 — High elev, descent fatigue, extreme clamps, honest axis labels

- **Date:** 2026-08-11  
- **Decision:** (1) Mild `altitudeLoadBump` from `maxElevM` (≥2500 m) into physical/intensity/risk — not AMS diagnosis. (2) Stronger descent weighting (`loss/140`, long/late descent → risk). (3) Sanitize route aggregates + duration ceiling (~22 h). (4) UI axes: 体力/强度结构/环境/行动风险 + explicit “no technical/nav from track” note. Verdict also respects high `risk`. `MODEL_VERSION` → `v0.1.7-elev-descent`.  
- **Status:** active  

### D-028 — Weather×route coupling; personalize/physio honesty

- **Date:** 2026-08-11  
- **Decision:** (1) Weather score bumps are **coupled**: heat×climb effort, rain×steep-descent share, storm→risk (not a blanket endurance dump). Duration multiplier softened and still applied once. (2) Drop experience `expDelta` on overall/risk — experience already shapes capability. (3) Default body metrics no longer move scores; explicit pack weight and complete HR/anthropometrics still can. `MODEL_VERSION` → `v0.1.6-weather-couple`.  
- **Context:** P1–P3 after physical/intensity scoring: weather was additive/`m` blur; personalize double-counted experience; physio defaults created false precision.  
- **Consequences:** Hot climb days rise more than hot flat days; wet steep descents raise risk; missing physio fields only affect confidence. No terrain/ridge fake factors.  
- **Status:** active  

### D-027 — Water: consume vs trailhead carry

- **Date:** 2026-08-11  
- **Decision:** Split water advice into `waterConsumeLiters` (day sweat estimate, effort-hours capped at 10) and `waterCarryLiters` (trailhead pack, clamped **1.5–3.5 L**). UI/explain emphasize carry; `waterLiters` aliases carry for compatibility. `MODEL_VERSION` → `v0.1.5-water-plan`.  
- **Context:** Long hot days (e.g. Xiaowutai) showed **7.7 L** from `hours × 0.7`, which reads as “bring 8 kg of water” and misleads beginners.  
- **Consequences:** Consume may still exceed carry when refills are assumed; note tells users to plan for no-water contingencies.  
- **Status:** active  

### D-026 — Physical + intensity in main score

- **Date:** 2026-08-11  
- **Decision:** Redefine Base axes for outdoor honesty while keeping field names: `endurance` = Physical (`0.7×dist + gain/100 + loss/180`), `climbing` = Intensity (density, continuous climb, steep/hard share, rolling, late-climb), `risk` = light operational flags (not a second dist+gain copy). Overall via `composeOverall` with a **physical floor** (`max(blend, endurance×0.78)`), shared by weather / physio / personalize layers. `MODEL_VERSION` → `v0.1.4-physical-intensity`.  
- **Context:** Audit found short-steep (~6 km / 900 m) reading ~轻松 while long-flat (~30 km / 400 m) scored harder — opposite of leader intuition. Segment structure existed but only fed brief copy.  
- **Consequences:** Ranking of Easy / Steep / Long / Xiaowutai-class routes aligns with day-hike experience; historical Predictions keep prior `modelVersion`. Terrain/technical/nav still unknown (no fake precision).  
- **Status:** active  

### D-025 — Calc guards: weather duration once, KML longest-ring, elev spikes

- **Date:** 2026-08-11  
- **Decision:** (1) Duration = dry personalization × `weatherMultiplier` **once** — weather still raises difficulty scores, but no longer also inflates Naismith via weather-weighted `overall`. (2) Multi-`LineString` KML keeps the **longest continuous ring** (no teleport stitch). (3) Route `elevationStats` skips `isElevationSpike` samples before hysteresis / min-max. `MODEL_VERSION` → `v0.1.3-calc-guards`.  
- **Context:** Audit after Xiaowutai climb fix: harsh weather duration ~3.5× from double count; distant KML rings joined into tens of km; single elev spikes still entered route gain while segments filtered them.  
- **Consequences:** Completing-window / water / dusk risk less exaggerated in storms; multi-placemark KML may drop short spurs; spike peaks no longer set `maxElevM`.  
- **Status:** active  

### D-024 — Elevation gain hysteresis (5 m)

- **Date:** 2026-08-11  
- **Decision:** Route (and segment) cumulative climb uses **5 m hysteresis**: only commit gain/loss after |Δh| from the last committed altitude exceeds the threshold. Segments still skip single-step GPS spikes before hysteresis. `MODEL_VERSION` → `v0.1.2-elev-hysteresis`.  
- **Context:** Dense tracks (e.g. 小五台东台–北台环线) summed every positive micro-jitter → ~3314 m displayed climb vs ~23.9 km / max 2875 m; ~2.6 km of that was sub-3 m steps.  
- **Consequences:** Xiaowutai-class loops land ~2.1 km climb; clean synthetic climbs unchanged; historical Predictions keep prior `modelVersion`. Fixture: `src/lib/engine/fixtures/xiaowutai.points.json`.  
- **Status:** active  

### D-023 — Comfort scale: beginner 10/500; pro ceiling 40/2500

- **Date:** 2026-08-11  
- **Decision:** Treat **10 km / 500 m as standard beginner comfort** (default experience = beginner). Raise UI ceiling to **40 km / 2500 m** for strong day-hikers; capability anchors **30 km / 1800 m**. Experience presets: beginner 10/500 · intermediate 15/800 · advanced 25/1400 · expert 35/2000. `MODEL_VERSION` → `v0.1.1-comfort-scale`.  
- **Context:** Previous UI capped at 25/1500 and capability saturated at 18/1000; product incorrectly framed 10/500 as intermediate.  
- **Consequences:** Skip/default profile is beginner; historical Predictions keep old `modelVersion`; new analyses need re-save for comparison. See [DIFFICULTY.md](./DIFFICULTY.md).  
- **Status:** active  

### D-020 — Hybrid Personal Difficulty with physiology as secondary layer

- **Date:** 2026-08-08  
- **Decision:** Base + weather + optional physiology (刘泓舟等) + personalization; physiology is reference, not primary narrative.  
- **Status:** active  

### D-021 — Soften climbing saturation (2026-08-08)

- **Date:** 2026-08-08  
- **Decision:** Reduce continuous-climb coefficient / cap run length; widen mid bands so Beijing day-hikes (~8–12 km, 500–800 m) land 适中–偏吃力 for intermediate profiles.  
- **Context:** Users reported “还好的线” labeled too hard; climbing often hit 100.  
- **Consequences:** Documented in `docs/DIFFICULTY.md`; historical local scores need re-analyze.  
- **Status:** superseded by D-023 (calibration target now beginner 10/500 → 适中～吃力)  

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
