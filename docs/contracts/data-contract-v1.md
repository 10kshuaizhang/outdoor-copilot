# Data Contract v1 (Week 1)

## Hard rules

1. **Prediction is immutable.** Once saved, numeric fields never update. Algorithm changes create a **new** Prediction.
2. **OutdoorProfile ≠ PersonalModel.** Profile is user-declared; PersonalModel is learned (stub only in v1).
3. **LLM never writes scores** into Prediction.

## Entities

| Entity | Persistence (Week 1) | Notes |
|--------|----------------------|--------|
| User | `outdoor_copilot_user_v1` | Local anonymous id |
| OutdoorProfile | `outdoor_copilot_profile_v2` | Declared fields |
| PersonalModel | type only | No learning yet |
| Route | embedded in Prediction bundle | Geometry summary + points ref |
| RouteSegment | embedded from engine segments | includes `estimatedEffort` + `effortLabel` (geometry only) |
| Analysis | embedded snapshot at predict time | Engine `RouteAnalysis` JSON |
| **Prediction** | `outdoor_copilot_predictions_v1` | Append-only list |
| Activity | type + empty store | Week 3 |
| Outcome | type only | Linked from Activity later |
| Feedback | may attach to Prediction id | Subjective / after-hike |

## Prediction record (required fields)

- `id`, `userId`, `createdAt`
- `modelVersion` (e.g. `v0.1-analyze`)
- `title`, `routeId` (optional local)
- `analysisId` (logical)
- `profileSnapshot`
- `personalDifficulty`, `band`, `confidence`
- `duration`: `{ lowMin, highMin, movingMin, totalMin }`
- `weatherSnapshot`
- `status`: `saved` | `hiking` (reserved) | `completed` (reserved)
- `outcomeId`: null until Week 3+

## Segment effort (Week 2)

Each engine segment carries:

- `estimatedEffort` — relative load from GPX geometry (not overall score input)
- `effortLabel` — `easy` | `hard_climb` | `moderate` | `descent`

Older Week 1 predictions without these fields are backfilled at display time via `ensureSegmentEffort`.

## Schema evolution

New algorithm → new `modelVersion` on **new** rows only.
Overall difficulty formula remains frozen at `v0.1-analyze` unless intentionally retagged.
