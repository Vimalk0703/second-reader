import { DecisionLogEntry, PipelineRun, Rubric, Submission } from "@/lib/types";
import { modelId } from "./anthropic";
import { extract } from "./extract";
import { intake } from "./intake";
import { generateProbes } from "./probes";
import { refute } from "./refute";

// Orchestrates S0 → S3 for one submission and assembles the auditable run
// record. Stage boundaries and autonomy levels are documented in the README's
// decision-boundary table; this file is that table, executable.
export async function runPipeline(
  submission: Submission,
  rubric: Rubric,
  onProgress?: (stage: string, message: string) => void
): Promise<PipelineRun> {
  const log: DecisionLogEntry[] = [];
  const note = (
    actor: DecisionLogEntry["actor"],
    action: string,
    detail: string | null = null,
    cardId: string | null = null
  ) => {
    log.push({ ts: new Date().toISOString(), actor, action, cardId, detail });
    onProgress?.(action, detail ?? "");
  };

  // S0 — deterministic intake, no model judgment.
  const { docs, redactions, sourceSha256 } = intake(submission);
  note(
    "system",
    "S0 intake",
    `Normalized ${docs.length} documents; ${redactions.length} redaction(s) applied (regex, demo-grade); sha256 ${sourceSha256.slice(0, 12)}…`
  );

  // S1 — evidence extraction (create-only).
  const extracted = await extract(docs, rubric);
  note(
    "ai",
    "S1 extract",
    `Extracted ${extracted.cards.length} evidence cards. Every card starts unconfirmed; only a human can change that.`
  );
  for (const card of extracted.cards) {
    if (card.flags.length > 0) {
      note("ai", "S1 flag", `Card flagged: ${card.flags.join(", ")}`, card.id);
    }
  }

  // S2 — adversarial refutation (annotate-only).
  const refuted = await refute(extracted.cards, docs);
  const contested = refuted.cards.filter(
    (c) => c.refutation && c.refutation.verdict !== "supported"
  );
  note(
    "ai",
    "S2 refute",
    `Skeptic verdicts attached: ${contested.length} of ${refuted.cards.length} cards contested (unverified or contradicted). Disagreements are surfaced, not resolved.`
  );

  // S3 — probes + synthesis (constrained, human-gated downstream).
  const generated = await generateProbes(refuted.cards, rubric);
  note(
    "ai",
    "S3 probes",
    `Drafted ${generated.probes.length} interview probes and a ${generated.synthesis.paragraphs.length}-paragraph synthesis (locked until every cited card is dispositioned by a human).${
      generated.attempts > 1 ? ` Output rejected ${generated.attempts - 1}× by the vocabulary guard before passing.` : ""
    }`
  );

  return {
    submissionId: submission.id,
    runAt: new Date().toISOString(),
    modelId: modelId(),
    promptVersions: {
      extractor: extracted.promptVersion,
      refuter: refuted.promptVersion,
      probes: generated.promptVersion,
    },
    rubricVersion: rubric.version,
    sourceSha256,
    redactions,
    cards: refuted.cards,
    probes: generated.probes,
    synthesis: generated.synthesis,
    log,
  };
}
