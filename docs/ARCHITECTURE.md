# Architecture — the agentic workflow and its stages

Second Reader is built as a **multi-step agentic workflow**: a fixed sequence of
single-purpose LLM stages, each with a narrow role and an explicit autonomy
boundary, orchestrated by deterministic code and gated by a human. This page
explains the stages, how they hand off, and the trust boundaries between them.

## What this is — and isn't — in plain terms

It's worth being precise, because "agent" is an overloaded word.

| Term | Definition | Is it this project? |
|---|---|---|
| **Workflow** | LLM calls orchestrated through **predefined code paths** | ✅ **Yes — this is a workflow** |
| **Autonomous agent** | An LLM that **directs its own control flow** — chooses which tools to call, how many times, when it's done (a loop) | ❌ No |

This uses Anthropic's own taxonomy (from "Building Effective Agents"), where
*workflows* and *agents* are two kinds of agentic system. Second Reader is a
**workflow** — specifically prompt-chaining with an adversarial
evaluator/skeptic step. Each stage is a **bounded, single-purpose LLM call**:
the model fills one structured schema and stops. There is no planning loop, no
memory, and no self-directed tool selection.

**No agent framework is used** — not LangChain, LangGraph, CrewAI, AutoGen, or
any Agents SDK. The whole thing is:

- **`@anthropic-ai/sdk`** for the model calls,
- **tool use (function calling)** purely as a *structured-output* mechanism —
  each stage forces one tool call so the model must return JSON matching a fixed
  schema (it is not freely choosing tools),
- **`zod`** to validate every output at the boundary,
- **plain TypeScript** orchestration in `lib/pipeline/run.ts` (~40 lines).

That this is bounded rather than autonomous is a deliberate design choice, not a
limitation. In a hiring context an autonomous loop is the wrong tool: you want
*predictable* autonomy, auditable handoffs, and a human holding every verdict.
This is the job description's "think in workflows, not just models … with
human-AI handoffs, decision boundaries, and **appropriate** levels of autonomy"
made concrete. The appropriate level here is low and bounded.

## The workflow

```mermaid
flowchart TB
    SUB["Candidate submission (untrusted text)"]:::data
    subgraph PIPE["Agentic workflow · orchestrated by lib/pipeline/run.ts"]
      direction TB
      S0["S0 · Intake (deterministic, no model) · normalize + redact"]:::code
      S1["S1 · Extractor stage · create-only · cited evidence cards"]:::agent
      S2["S2 · Skeptic stage · annotate-only · refute each card"]:::agent
      S3["S3 · Interviewer stage · constrained · probes + synthesis"]:::agent
      S0 --> S1 --> S2 --> S3
    end
    RUBRIC["rubric.json · 6 JD-derived competencies"]:::data
    SUB --> S0
    RUBRIC -.->|feeds| S1
    RUBRIC -.->|feeds| S3
    S1 -.->|every card born unconfirmed| HUMAN
    S3 --> HUMAN{{"Human reviewer · confirm / edit / reject / add · the only actor that writes a verdict"}}
    classDef agent fill:#e7eef8,stroke:#00338d,color:#00338d;
    classDef code fill:#f4f6fa,stroke:#858aa0,color:#1a1c22;
    classDef data fill:#ffffff,stroke:#c6cddd,color:#51566a;
```

## The stages

| Stage | Role | Autonomy | Reads | Writes | Governed by |
|---|---|---|---|---|---|
| S0 *(deterministic code, no model)* | Normalize text; redact direct identifiers | Full (no model judgment) | Raw submission | Clean text + escrowed redaction map | `lib/pipeline/intake.ts` |
| S1 **Extractor** | Read charitably; surface evidence for the rubric | **Create-only** — it can only propose cards; every card is born `unconfirmed` | Redacted docs + rubric | Evidence cards: claim, competency, **verbatim** citation, substance grade | `prompts/extractor.md` |
| S2 **Skeptic** | Try to refute each card using only the same documents | **Annotate-only** — it cannot create, remove, or rewrite cards | Cards + docs | A verdict per card (`supported` / `unverified` / `contradicted`) + counter-citation | `prompts/refuter.md` |
| S3 **Interviewer** | Turn evidence gaps into interview questions; draft a synthesis | **Constrained** — every synthesis sentence must cite card IDs; the schema has no verdict field; verdict vocabulary is rejected in code | Cards + verdicts + rubric | Interview probes + synthesis draft | `prompts/probes.md` |
| Human reviewer | Judge | **Total** — the only actor that can set a card's status or reach a conclusion | Everything above | confirm / edit / reject / add | The UI (`components/`) |

Each model stage is one call with a **forced tool** whose input schema *is* the
zod contract for that stage (`lib/pipeline/anthropic.ts`, `callStage`). The
model cannot return free-form text; it must fill the structured shape, which is
validated before the next stage runs. Invalid output gets one repair attempt,
then the stage fails loudly rather than passing unvalidated data downstream.

## How the stages hand off (and why the handoffs are safe)

- **S0 → S1.** Identifiers are stripped before any model sees the text, so the
  judging is of work, not the person. S0 is deterministic on purpose — there is
  no model judgment to gate.
- **S1 → S2.** The extractor reads *charitably* (find the strongest honest
  evidence); the skeptic reads *adversarially* (try to knock it down). Splitting
  these into two stages with opposing instructions is the point — they disagree
  exactly where a human should look. The skeptic can only *annotate*; it can
  never quietly delete a card it dislikes.
- **S2 → S3.** The interviewer only ever turns gaps into *questions* and a
  *cited* draft. It is structurally unable to emit a score or a recommendation
  (no such field exists), and a code-level vocabulary guard rejects verdict
  phrasing even if the model produces it.
- **S3 → Human.** The drafted summary stays gated in the UI until the human has
  judged every card. The human is the only actor who can write a verdict.

## The runtime contract (every stage boundary)

Defined once in `lib/pipeline/anthropic.ts` and applied to all three model stages:

1. **Forced structured output** — a tool call whose schema is the stage's zod
   contract. No prose, no scores (there is no field for one).
2. **Validate-or-repair-or-fail** — output is zod-validated; one repair retry;
   then a loud failure. Nothing unvalidated reaches the next stage.
3. **Streaming + native-JSON** — calls stream (so large inputs don't hit the
   non-streaming time limit) and the tool is instructed to return native JSON
   types; a transport-level normalizer repairs the occasional stringified or
   fenced payload losslessly.
4. **Provenance** — every run records the model id, each stage's prompt version,
   the rubric version, and a hash of the source, so any output is traceable to
   the exact prompts that produced it.

## Trust boundaries

- **Candidate text is untrusted.** It is data, never instructions. Injection
  attempts are surfaced as flagged findings, not obeyed (tested in CI).
- **Client vs. server.** The model calls and the API key live server-side
  (`lib/pipeline/`, `app/api/pipeline/run/route.ts`); the browser only ever
  receives validated results. The committed demo needs no key at all.
- **AI vs. human.** The stages propose; only the human disposes. The data model
  enforces this — stages write evidence and doubt; only UI actions write a
  card's status.

## Why not autonomous agents (and where they'd fit)

A fully autonomous agent — one that plans, calls tools in a loop, and decides
when it's done — would be a poor fit here: it trades the auditable, bounded
handoffs that a hiring process needs for flexibility it doesn't. If this pattern
were extended (a "not now" item), the natural place for more autonomy is
*sourcing* the evidence, not *judging* it: e.g., a step that fetches and
normalizes a candidate's linked artifacts before S1. The judging workflow would
stay exactly this bounded.
