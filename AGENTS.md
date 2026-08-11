# Outdoor Copilot Engineering Rules

1. Read [`docs/01-three-month-roadmap.md`](docs/01-three-month-roadmap.md) before implementing roadmap work.

2. Read [`docs/00-product-vision.md`](docs/00-product-vision.md), [`docs/03-data-strategy.md`](docs/03-data-strategy.md), and [`docs/04-ai-architecture.md`](docs/04-ai-architecture.md) before introducing new product architecture.

3. Deterministic calculations must never depend on LLM output.

4. Every prediction must be persisted as an immutable Prediction record.

5. Every actual activity must be linked to the prediction when possible.

6. Never overwrite historical prediction results when algorithms change.

7. Every model-derived score must include:
   - score
   - confidence
   - sample_count
   - model_version

8. Every weather-dependent analysis must persist:
   - provider
   - forecast timestamp
   - target timestamp
   - weather snapshot
   - model/version if available

9. Do not build social features unless explicitly requested.

10. Do not build generic AI chat.

11. Do not introduce ML infrastructure before a deterministic baseline exists.

12. Every new data source must have:
    - provenance
    - timestamp
    - permission model
    - retention policy

13. Every feature must have a measurable product outcome (see [`docs/06-metrics.md`](docs/06-metrics.md)).

14. Prefer simple implementations that increase the quality of the Outdoor Event dataset.

15. The primary product loop is:

    ```text
    Prediction
      ↓
    Activity
      ↓
    Outcome
      ↓
    Model Improvement
    ```

16. Record material decisions in [`docs/05-decision-log.md`](docs/05-decision-log.md).

17. Operations / growth work should follow [`docs/02-operation-manual.md`](docs/02-operation-manual.md).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
