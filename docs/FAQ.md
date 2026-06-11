# FAQ — the hard questions, answered honestly

The questions a careful reviewer asks about a tool like this, with direct
answers. Where something is prototype-grade, this says so plainly — the point
of the project is judgment under constraint, not a pretence of production
readiness.

## Direction and framing

### Why a score-free tool? The brief allowed a scoring tool.
It did, and scoring is the easier build — one prompt returns a number. The
harder, more useful thing is making AI helpful *short of* the verdict: cited
evidence, an adversarial second pass, interview questions from the gaps. Two
reasons it's score-free by design: (1) a score column becomes a ranking the
moment it exists, whatever the disclaimer says, and at volume the tool would
*be* the decision-maker; (2) it matches the stated posture of the organization
this is built for — that hiring decisions are made by people, not AI. If a
panel wanted calibrated ratings, I'd add them as *human-entered* fields with
behavioural anchors — additive to this design, not a rebuild.

### Isn't "evidence selection" still shaping the decision?
Yes — and that's the first item in the risk register, conceded rather than
defended. Choosing which evidence a reviewer sees shapes the review even when a
human holds every verdict. The claim is **auditability, not neutrality**: every
selection is logged, cited, and challengeable, and reviewers add evidence the
AI missed. No tool of this kind is neutral; distrust one that says it is.

## Architecture and "agents"

### Is this "agents"? What agent framework did you use?
None — and I'm precise about this on purpose. It's an **agentic workflow**, not
autonomous agents. Using Anthropic's own taxonomy, a *workflow* is LLM calls run
through predefined code paths; an *agent* is an LLM that directs its own control
flow (chooses tools, loops, decides when it's done). This is a workflow:
prompt-chaining with an adversarial skeptic step. Each stage is one bounded LLM
call that fills a fixed schema and stops — no planning loop, no memory, no
self-directed tool use.

The stack is deliberately framework-free: the **Anthropic SDK** for the calls,
**tool use** only as a structured-output mechanism (a forced single tool call to
return schema-valid JSON — not the model freely picking tools), **zod** for
validation, and **plain TypeScript** orchestration in `lib/pipeline/run.ts`. No
LangChain, LangGraph, CrewAI, AutoGen, or Agents SDK.

Why no framework and no autonomy? In a hiring/governance context you want
predictable, auditable control flow and a human holding every verdict — not an
LLM choosing its own steps. Choosing the *appropriate* (low, bounded) level of
autonomy is the point, and it's exactly what the job description asks for. Full
detail in [ARCHITECTURE.md](ARCHITECTURE.md).

## The "guarantees"

### Is "no score" really architectural, or just a prompt instruction?
Architectural. There is no `score`, `rating`, `rank`, or `recommendation` field
in any type at any model boundary (`lib/types.ts`, `lib/pipeline/schemas.ts`).
A unit test (`tests/schemas.test.ts`) asserts that even if a caller attached a
`score`, the schema strips it. A second guard, `findVerdictVocabulary`
(`lib/pipeline/schemas.ts`, tested in `tests/vocabulary.test.ts`), rejects
verdict *phrasing* in the synthesis's own voice. It's a regex over nine
patterns, not a theorem — it can be probed for evasions — but it's tested,
including the subtle case where the tool must still be able to *describe* a
score-free design without tripping on the word "score."

### Is the probe-gate (judge evidence before seeing the summary) actually enforced?
No — and the docs say so. The drafted summary is withheld in the UI until every
card is judged, and the export is disabled until then, but the text is in the
page payload, so a determined reviewer could read it in devtools. It is an
**anchoring control for the reviewer who wants to do it right**, not a security
boundary. Enforcing it server-side (don't send the summary until a per-reviewer
disposition state proves every card was judged) is the honest next step.

### How do you know the AI didn't fabricate a quote?
Quotes are located in the source by exact string match (`lib/pipeline/locate.ts`,
tested in `tests/locate.test.ts`). A quote that can't be found verbatim is
flagged `citation-mismatch` and excluded from the summary — the model cannot
introduce text that isn't in the source. The eval enforces zero tolerance on
every committed run; the current runs carry several caught mismatches, left in
on purpose as proof the mechanism fires.

## Evaluation

### Your eval is two synthetic fixtures you wrote. Does it generalize?
It does not claim to. Every number is labelled "illustrative — n=2 synthetic
fixtures." What the eval proves is *behaviour*, not accuracy at scale: citation
fidelity, injection resistance, catching a planted cross-document contradiction,
and the vocabulary ban — these are guarantees that must hold on every run, and
CI fails if they don't. The harness is the asset: it's how you'd scale to n=50
with real, messy submissions. Validating recall/precision on real data is named
as the work that comes before any real-candidate use.

### Why isn't the dogfood fixture eval-labelled?
It has no hand-labelled expected findings — it exists to prove the pattern on an
*unseen, real, technical document* (this repo's own README and DECISIONS) rather
than as a golden case. It is still CI-gated for the hard structural guarantees
that must hold on every run (citation fidelity, the vocabulary ban) — see its
entry in `evals/golden.json`.

### What's the model/prompt change-management process?
Prompts are versioned in their front-matter and the version flows into the
decision log, so every run is traceable to the exact prompts that produced it.
A prompt or model change means the committed runs are stale: re-run the affected
fixtures, re-check the golden labels, and re-run `npm test && npm run eval`. This
is written up in [CONTRIBUTING.md](../CONTRIBUTING.md) and gated by the PR
template.

## Security and privacy

### The live endpoint calls a paid model — what stops abuse?
On the public deployment the route is env-gated, fixture-only (so input size is
bounded — no arbitrary uploads), zod-validated, and rate-limited. The honest
limitation: the rate limiter is in-memory and per-instance, so on serverless it
is not a hard cap. The clean options are to put the route behind a shared
secret, move the limit to a shared store with a daily spend ceiling, or run the
public demo with live mode **off** (no key) so it cannot incur spend at all.
See [SECURITY.md](../SECURITY.md).

### Redaction is regex-only. Isn't "we hid your name" an over-claim?
It would be if stated baldly, which is why the in-product copy and the
transparency page now say "direct identifiers (names, emails, phones) were
removed by a pattern-based pass" and explicitly note it can't catch subtler
signals like writing style. The deeper point: redaction alone can't make review
fair, which is why the design leans on *structural* fairness — one substance
scale across formats, probes instead of silent deductions, full traceability.
An LLM redaction pass plus a privacy review is required before any real data.

### The audit log lives in localStorage. In what sense is it "append-only"?
By convention in prototype client state, not by enforcement — a user could edit
it in devtools, and no reviewer identity is captured. The design (attributable
entries, run provenance hashed via `sourceSha256`, exportable record) is the
demonstrated thing; the durable, authenticated, immutable store is the
production requirement, named in SECURITY.md and DECISIONS.md.

### What about injection that rides inside a legitimate quote into later stages?
Real residual risk. The extractor flags overt injection, but candidate text is
re-serialised into the S2/S3 prompts as JSON "data" with prompt-level
separation, not a structural boundary. The backstops are the citation locator
and the vocabulary guard. The eval tests one planted injection; injection
variants that survive into S2/S3 are listed as a known gap in SECURITY.md.

## Legal and responsible AI

### Does this count as "assessment" under Ontario's AI-disclosure law?
It's an evidence-selection-and-probe-drafting aid that informs a human reviewer,
which is exactly why the disclosure posture matters. The transparency page is
the candidate-facing disclosure, generated from the same rubric the pipeline
uses so it can't drift. Whether it legally constitutes "assessment" under the
*Working for Workers Four Act, 2024* is a question for counsel before any real
use — flagged, not assumed.

### What's the fairness-review plan before real candidates?
Named as a prerequisite, not done here: I/O-psychology review of the rubric and
substance ladder, a DEI review for adverse-impact pathways (including the
redaction gap), and an automation-bias test with real panelists — the last is
the #1 untested risk in DECISIONS.md.

## Practical

### Why Claude / what does a review cost?
Structured tool-use outputs validated against zod schemas at every boundary;
the pattern works with any model that does constrained JSON well, and the model
ID is recorded per run so swaps re-certify via the evals. Cost is three model
calls per submission on the happy path — one per stage; a rejected S3 draft or a
schema-repair retry adds one more. Cents per candidate either way, dwarfed by a
minute of reviewer time. At volume the bound is reviewer attention, which is the
resource the tool optimises.

### How do I retarget it to something other than hiring?
Swap `rubric/rubric.json` and nothing else. The same cited-evidence,
adversarially-checked, human-gated pattern reads vendor proposals against
procurement criteria, engagement deliverables against QA standards, or policy
documents against control frameworks. The hiring rubric is one instance; the
pattern is the asset.
