# Security policy

Second Reader is a prototype built for a hiring case study. It is not a
production system, and it should not process real candidate data in its current
form. This document states what is in scope, the known limitations, and how to
report a problem. The threat-model table below is the consolidated analysis.

## Reporting a vulnerability

Open a GitHub issue marked **security**, or email the maintainer
(vimalkumar.parthasarathy@gmail.com). Please do not include real personal data
in a report. There is no bug bounty; this is an assessment artifact.

## Secrets

- The Anthropic API key is **server-side only** (`ANTHROPIC_API_KEY`). It is
  read server-side in `lib/pipeline/anthropic.ts`; the route handler
  `app/api/pipeline/run/route.ts` gates live mode on it via `hasApiKey()`. It is
  never imported into a client component and never sent to the browser. The
  committed demo runs on precomputed fixtures and need no key at all.
- `.env.local` is git-ignored. `.env.example` documents the variables with
  empty values.

## Handling of untrusted input

Candidate submissions are **untrusted data, not instructions.** The pipeline
treats them accordingly:

- Every stage prompt states that documents are data to be read, never commands
  to obey.
- Text that tries to address the AI (prompt injection) is extracted as a
  flagged finding (`injection-suspect`) and surfaced to the human reviewer — it
  is never acted on. This is covered by an automated test in the eval suite
  (`evals/run-eval.ts`, `trap-b-injection`) that fails CI if an injection ever
  influences the generated summary.
- Model-proposed quotes are located in the source by exact string match
  (`lib/pipeline/locate.ts`). A quote that cannot be found verbatim is flagged
  `citation-mismatch` and excluded from the summary — the model cannot
  introduce text that is not in the source.

## Live-mode endpoint

`POST /api/pipeline/run` is the only mutating route. On the public deployment it
is deliberately constrained:

- **Env-gated** — without `ANTHROPIC_API_KEY` it returns `503` and the app stays
  in demo mode.
- **Fixture-only** — it re-runs a known committed submission; it does not accept
  arbitrary uploaded documents, which bounds both the input surface and spend.
- **Rate-limited** — an in-memory sliding-window limit (3 runs / 10 min) plus a
  per-instance lifetime cap. Demo-grade and per-instance (resets on cold start),
  disclosed as such; a real deployment would enforce this in a shared store with
  a daily budget.
- **Input-validated** — the body is parsed with zod; malformed input returns
  `400`.

## Threat model (summary)

| Asset | Threat | Mitigation in this repo | Residual risk |
|---|---|---|---|
| Reviewer judgment | Prompt injection in a submission steers the AI | Documents framed as data-not-instructions in every prompt; injection extracted as a flagged finding; eval `trap-b-injection` fails CI if it influences the summary | Injection riding inside a legitimately-surfaced quote into S2/S3 is only prompt-level defended — a known residual risk |
| Candidate fairness | AI fabricates or paraphrases a quote | Quotes located by exact string match; mismatches flagged and excluded (`lib/pipeline/locate.ts`, tested) | None for verbatim fidelity; semantic mis-selection is conceded (auditability, not neutrality) |
| Candidate privacy | Direct identifiers reach the model | Regex redaction of email/phone/profile links/name (`lib/pipeline/intake.ts`, tested) | Style/indirect identifiers survive — named; needs LLM redaction + privacy review before real data |
| API spend | Abuse of the live endpoint | Env-gated, fixture-only (bounded input), zod-validated, in-memory rate limit | Per-instance limiter on serverless is not a hard cap — see below; the public deploy can run with live mode **off** (no key) to eliminate this |
| Audit integrity | Tampered decision log | Append-only by convention; exportable; run provenance hashed (`sourceSha256`) | Client-side `localStorage`, no auth — prototype-grade; production needs a server-side immutable store |
| No-score guarantee | AI emits a verdict about a person | No score field exists at any boundary; `findVerdictVocabulary` rejects verdict phrasing (tested, with the quoted-span-exempt path) | Regex guard can be probed for evasions — covered by tests, not exhaustive |

## Known limitations (by design, for a prototype)

| Area | Current state | Production requirement |
|---|---|---|
| Redaction | Regex only — removes direct identifiers (email, phone, profile links, name). Writing style can still proxy for demographics. | An LLM redaction pass plus a privacy review before any non-synthetic data. |
| Reviewer state / audit log | Browser `localStorage`. | An authenticated, append-only, immutable store. |
| Rate limiting | In-memory, per-instance. | Shared, durable rate limiting. |
| AuthN / AuthZ | None. | SSO + role-based access before real use. |

All data shipped in the repository is synthetic and labelled as such.
