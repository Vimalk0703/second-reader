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

<!-- EVAL-HISTORY: filled in from the actual first runs before fixture C is generated -->

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
