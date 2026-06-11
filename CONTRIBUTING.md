# Contributing

A short guide to running, checking, and extending Second Reader. This is a
prototype; the goal is that someone can pick it up, understand the moving parts,
and adapt it without reverse-engineering the whole thing.

## Setup

```bash
npm install
npm run dev          # demo mode — full app on committed fixtures, no API key
```

Live mode (optional) needs an Anthropic key:

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run pipeline candidate-a    # re-run the real pipeline on a fixture
```

## Checks (run these before opening a PR — they mirror CI)

```bash
npm run lint
npm run typecheck
npm test          # unit tests for the trust-critical pure functions
npm run eval      # checks the committed pipeline runs against their guarantees
npm run build
```

CI (`.github/workflows/ci.yml`) runs the same five on every push and pull request.

## How it fits together

- `lib/pipeline/` — the four pipeline stages (`intake` → `extract` → `refute` →
  `probes`) and the shared contracts (`schemas.ts`, `locate.ts`, `anthropic.ts`).
  Start with `lib/pipeline/run.ts`; it reads top-to-bottom like the
  decision-boundary table in the [README](README.md).
- `rubric/rubric.json` — the six competencies and their job-description
  provenance. **This is the one file you swap to retarget the tool** (see the
  reuse note in the README).
- `prompts/*.md` — the per-stage prompts, each with a `version:` header.
- `fixtures/` — synthetic submissions plus their committed pipeline runs.
- `evals/` — the eval harness and the hand-labelled golden set.
- `components/` + `app/` — the reviewer UI.

## Conventions

- **TypeScript strict**, and every model output is validated with zod at the
  boundary (`lib/pipeline/schemas.ts`). The data model has no score / rank /
  verdict field — keep it that way.
- **Prompts are versioned.** If you change a prompt, bump its `version:` header.
  A prompt or model change means the committed runs are stale: re-run the
  affected fixtures (`npm run pipeline <id>`), re-check the golden labels, and
  re-run `npm test && npm run eval`. The version flows into the decision log so
  every run is traceable to the exact prompts that produced it.
- **Plain language.** Pipeline output is read by recruiters, not engineers —
  the prompts enforce short, jargon-free sentences. Keep it that way.

## Adding a fixture

1. Create `fixtures/<id>/submission.json` (see an existing one for the shape).
2. `npm run pipeline <id>` writes `fixtures/<id>/run.json`.
3. To CI-gate it, add an entry under `fixtures` in `evals/golden.json`.
