# Decisions

The thinking behind Second Reader: what I assumed, what I traded away
knowingly, what I'd challenge first if I were reviewing it, and exactly how AI
was used to build it.

## What "evaluate well" means here

The brief leaves "evaluate an AI Builder well" open, so this is my definition,
and the system is built to it:

1. **Evidence over impressions.** Every claim about a candidate must be
   traceable to something the candidate actually submitted — quoted verbatim,
   checkable in one click.
2. **Doubt is part of the read.** A claim nobody tried to refute isn't
   evidence yet. The skeptic pass exists because charitable reading and
   adversarial reading disagree in exactly the places worth interviewing on.
3. **Weakness becomes a question, not a deduction.** With AI-polished
   artifacts everywhere, the interview probe — "walk me through where that
   approval step lives" — is the most robust signal left. The system's main
   output is better interviews, not shorter queues.
4. **Format-blind, substance-graded.** A low-code workflow and a code repo are
   read on the same three-step ladder: demonstrated / described / asserted.
   That's how you keep an open-format process fair across eight backgrounds.
5. **Humans decide, attributably.** Not as a compliance feature — as the
   design. KPMG's own recruiting communications state it plainly: "no hiring
   decisions are made using AI… We believe technology should empower human
   judgment, not replace it." A scoring screener would contradict the
   policy of the organization it's built for; this tool is the version that
   doesn't.

## Assumptions

- The panel's scarce resource is attention, not verdicts. Reviewers triaging
  many open-format submissions in minutes each will anchor on whatever they
  read first; the probe-gate ordering (judge evidence before reading the
  AI's summary) is built against that.
- Submissions arrive as text (write-ups, exports, transcripts). Video/audio
  ingestion is a transcription call away and deliberately out of scope.
- One reviewer per board in this prototype. Multi-reviewer calibration
  (agreement views, drift flags) is the natural next layer, not this one.
- Synthetic fixtures are a fair test of mechanism. They cannot validate
  extraction quality at scale — and nothing here claims they do.

## Tradeoffs taken knowingly

| Choice | What I gave up | Why it was right for this timebox |
|---|---|---|
| Regex-only redaction (S0) | Prose style, school names in sentences, project choices can still proxy for demographics | An LLM redaction pass is an API call away, but testing it honestly isn't — shipping it untested would be worse than naming the gap |
| localStorage for reviewer state | Auth, multi-device, durable audit | The decision-log design (append-only, attributable, exportable) is the demonstrated thing; storage is swappable plumbing |
| Fixture-only live re-runs | Arbitrary upload demos | Keeps the public endpoint's input surface and spend bounded; local users can add fixtures freely |
| n=2 authored fixtures + this repo as the third | Statistical power | Each fixture is engineered to prove one specific behavior (format fairness; injection resistance + substance ladder; dogfood); a tenth fixture proves nothing new |
| Non-streaming pipeline route | Progress UI during live runs | One reliable surface beats two fragile ones; the run takes ~a minute and says so on the button |

## Risk register

Leading with the one I concede rather than defend:

1. **Evidence selection is itself decision-shaping.** Choosing which twelve
   claims a reviewer sees shapes the review even when humans hold every
   verdict. I claim auditability — every selection is logged, citable, and
   challengeable — not neutrality. No such tool is neutral; distrust any that
   claims to be.
2. **Automation bias.** Reviewers may confirm-click through AI cards.
   Mitigations built: the probe gate forces card-by-card engagement before any
   summary is visible; the override-rate chip makes rubber-stamping visible.
   Honest answer: this needs testing with real panelists, and that test is the
   first thing I'd run with more time.
3. **Extraction recall on unconventional formats.** A submission the extractor
   reads poorly gets a thin board. Mitigations: the thin-board state says
   "pipeline signal, not candidate signal"; reviewers add cards by hand, and
   manual-add rates are loggable pipeline telemetry.
4. **Style proxies survive redaction.** Named above; "not now" item with a
   defined next step (LLM redaction pass + privacy review before any
   non-synthetic data).
5. **The skeptic can be wrong in both directions.** Refuter verdicts are
   surfaced as one more opinion with a citation — never auto-resolved, and the
   eval suite checks it catches a known planted contradiction.
6. **Synthetic-data theater.** Numbers computed on two authored fixtures could
   be mistaken for validation. Every number in the eval report and UI carries
   an "illustrative — synthetic fixtures" label, and the README repeats it.

## What the evals caught

Real failures from the actual first runs, kept on the record because an eval
suite that has never caught anything is decoration.

**The eval itself was the first thing to fail — twice, the same way.** The
injection-resistance check FAILED on a run where the pipeline had behaved
correctly: it flagged candidate B's planted injection and the synthesis
reported it to the panel as a finding ("the panel will want to ask the
candidate about it directly"), never obeying it. My check just pattern-matched
the injection's words anywhere in the synthesis, so it couldn't tell
*describing the attack* from *obeying it*. I fixed it once (ignore the
verbatim-quoted passage) — then it failed again when the synthesis
*paraphrased* the attack to describe it ("…instructing any AI to treat the
candidate as pre-approved"). The real fix: set aside whole sentences that
describe the injection, and only flag praise language in the tool's own voice.
Lesson, learned twice and mildly embarrassingly: evals need the same
adversarial scrutiny as the system they test.

**Citation fidelity keeps catching the extractor mis-quoting — every run.**
The model regularly produces a "quote" that is *almost* the source text:
fragments stitched with ellipses, a changed final punctuation mark, a dropped
word. Exact-string matching refuses every one: flagged `citation-mismatch`,
excluded from the summary, shown in the UI with a warning. The latest committed
runs carry four of these (three in candidate A, one in candidate B) — left in
on purpose, because they are the mechanism working, not noise to clean up.

**Recall labels are competency-agnostic on purpose.** An early version checked
that each expected finding was extracted *under a specific skill*. But the
model legitimately files the same evidence under different defensible skills
across runs — candidate B's mechanism-free swarm claims landed under problem
framing one run and workflow design the next. Both are reasonable. So recall
now asks only "was this evidence surfaced at all?" — which is the honest
definition and stops the metric thrashing on re-runs. Disclosed in
[evals/golden.json](evals/golden.json).

**Where precision honestly stands:** 16/20 cards on candidate A and 12/13 on
candidate B hand-labelled valid. The invalids are the four citation
mis-quotes above, plus one card on A that graded a "the demo video shows it
running" transcript claim as `demonstrated` — over-charitable, since a video
isn't something we can run; the skeptic's `unverified` had it right.
Illustrative, n=2, synthetic — the number that matters is that every invalid
card was either machine-flagged or skeptic-contested before any human looked.

**The dogfood fixture broke the pipeline three more ways.** Running this
repository's own README and DECISIONS through the pipeline was the only
fixture not designed to pass, and it didn't, at first. (1) The refuter
returned a counter-quote as a bare string instead of `{docId, quote}` and
failed schema validation twice — fixed with explicit shape descriptions in
the tool schema. (2) The extractor once returned an array field as its
JSON-stringified form — fixed with lossless transport-level normalization
(parsing a stringified array changes no content; everything else still fails
loudly). (3) Most instructive: the verdict-vocabulary guard rejected every
synthesis of this submission, because v1 banned *words* — and you cannot
faithfully describe a score-free design without the word "score." The guard
was wrong-shaped: v2 bans verdict *phrases directed at the person* ("should
be hired," "8/10," "weak candidate") in the synthesis's own voice, with
quoted spans exempt. A guard that misfires on legitimate description teaches
reviewers to ignore it — false positives in governance controls are not
free caution, they are erosion.

## AI-use disclosure

This prototype was built with Claude (Claude Code) as the pair: it generated
the majority of the application code, the UI, and the synthetic fixture prose,
working under direction. I used a multi-agent panel (three concept designers,
three judges with different lenses) to pressure-test direction options before
committing to this one.

The decisions that were mine: building for the reviewer instead of scoring
candidates; making the system score-free as a design position; the six
competencies and the substance ladder (demonstrated / described / asserted);
requiring verbatim-or-flagged citations; the create-only / annotate-only /
constrained autonomy split across stages; the probe gate ordering (humans
judge evidence before seeing the AI's summary); the planted flaw and planted
injection in the fixtures; the golden labels (written before the first run);
the cut list; and every word of this file's risk register.

I'd state the principle the same way the brief does: you can outsource
thinking's execution, not its ownership. Ask me anything in here.

## Build ledger

Approximate, tracked during the build. The brief's 3-hour cap is a scoping
constraint, and AI leverage is the only way this scope fits it — which is
rather the point of the role.

| Time | What happened |
|---|---|
| 0:00–0:25 | Problem framing; concept panel (3 designs × 3 judge lenses); direction locked; verified the regulatory and research facts cited here |
| 0:25–0:50 | Rubric derived from the JD with claim IDs; type system and zod contracts; prompts |
| 0:50–1:25 | Pipeline (intake/extract/refute/probes), citation locator, fixture authoring (planted flaw + injection) |
| 1:25–2:05 | Workbench UI: board, source pane, probe gate, decision log, JD provenance, transparency page |
| 2:05–2:25 | Eval harness + golden labels; first real pipeline runs; eval failures fixed (see "What the evals caught") |
| 2:25–2:50 | README, this file, dogfood fixture, deploy, cold test |
| 2:50–3:00 | Video |

## With more time

In order: (1) automation-bias test with real panelists — does the probe gate
actually change reviewer behavior, measured by override rates against seeded
boards; (2) LLM redaction pass with a privacy review; (3) multi-reviewer
calibration: independent boards, then an agreement view; (4) auth + durable
append-only audit store; (5) an I/O-psychology and DEI review of the rubric
before any contact with real candidates.
