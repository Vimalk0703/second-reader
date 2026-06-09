import { z } from "zod";

// ---------------------------------------------------------------------------
// Core vocabulary
//
// There is deliberately no score, rating, rank, or recommendation type
// anywhere in this file. The data model cannot express a verdict about a
// candidate; only evidence, doubt, and questions. See DECISIONS.md.
// ---------------------------------------------------------------------------

export const COMPETENCY_IDS = ["C1", "C2", "C3", "C4", "C5", "C6"] as const;
export const CompetencyId = z.enum(COMPETENCY_IDS);
export type CompetencyId = z.infer<typeof CompetencyId>;

export const SubstanceGrade = z.enum(["demonstrated", "described", "asserted"]);
export type SubstanceGrade = z.infer<typeof SubstanceGrade>;

export const RefuterVerdict = z.enum(["supported", "unverified", "contradicted"]);
export type RefuterVerdict = z.infer<typeof RefuterVerdict>;

export const CardFlag = z.enum(["injection-suspect", "citation-mismatch"]);
export type CardFlag = z.infer<typeof CardFlag>;

// ---------------------------------------------------------------------------
// Submissions (fixtures)
// ---------------------------------------------------------------------------

export const SubmissionDocSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(["write-up", "workflow-export", "transcript", "code", "readme", "pitch"]),
  text: z.string(),
});
export type SubmissionDoc = z.infer<typeof SubmissionDocSchema>;

export const SubmissionSchema = z.object({
  id: z.string(),
  candidateName: z.string(),
  background: z.string(),
  format: z.string(),
  synthetic: z.boolean(),
  syntheticNote: z.string(),
  documents: z.array(SubmissionDocSchema).min(1),
});
export type Submission = z.infer<typeof SubmissionSchema>;

// ---------------------------------------------------------------------------
// Citations — located by the pipeline, verified by exact string match.
// The model only ever proposes (docId, quote); offsets are computed by our
// code from the normalized text. A quote that cannot be located verbatim
// becomes a citation-mismatch flag, never a silent fix.
// ---------------------------------------------------------------------------

export const CitationSchema = z.object({
  docId: z.string(),
  quote: z.string().min(1),
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
});
export type Citation = z.infer<typeof CitationSchema>;

// ---------------------------------------------------------------------------
// Evidence cards (S1 output, annotated by S2)
// ---------------------------------------------------------------------------

export const RefutationSchema = z.object({
  verdict: RefuterVerdict,
  rationale: z.string(),
  counterCitation: CitationSchema.nullable(),
});
export type Refutation = z.infer<typeof RefutationSchema>;

export const EvidenceCardSchema = z.object({
  id: z.string(),
  competencyId: CompetencyId,
  claim: z.string(),
  substance: SubstanceGrade,
  citation: CitationSchema,
  flags: z.array(CardFlag),
  refutation: RefutationSchema.nullable(),
});
export type EvidenceCard = z.infer<typeof EvidenceCardSchema>;

// ---------------------------------------------------------------------------
// Probes and synthesis (S3 output)
// ---------------------------------------------------------------------------

export const ProbeQuestionSchema = z.object({
  id: z.string(),
  competencyId: CompetencyId,
  gap: z.string(),
  question: z.string(),
  citedCardIds: z.array(z.string()),
});
export type ProbeQuestion = z.infer<typeof ProbeQuestionSchema>;

export const SynthesisSchema = z.object({
  paragraphs: z
    .array(
      z.object({
        text: z.string(),
        citedCardIds: z.array(z.string()).min(1),
      })
    )
    .min(1),
});
export type Synthesis = z.infer<typeof SynthesisSchema>;

// ---------------------------------------------------------------------------
// Decision log — append-only. AI entries are written by the pipeline run;
// human entries are appended client-side. The `actor` field is the audit
// trail's spine: every row is attributable.
// ---------------------------------------------------------------------------

export const DecisionLogEntrySchema = z.object({
  ts: z.string(),
  actor: z.enum(["ai", "human", "system"]),
  action: z.string(),
  cardId: z.string().nullable(),
  detail: z.string().nullable(),
});
export type DecisionLogEntry = z.infer<typeof DecisionLogEntrySchema>;

// ---------------------------------------------------------------------------
// Redaction (S0) — deterministic, demo-grade. The map is kept so a reviewer
// with the right authority could audit what was removed; the model never
// sees the originals.
// ---------------------------------------------------------------------------

export const RedactionSchema = z.object({
  docId: z.string(),
  kind: z.enum(["email", "phone", "url-personal", "name-wordlist"]),
  original: z.string(),
  replacement: z.string(),
  count: z.number().int().positive(),
});
export type Redaction = z.infer<typeof RedactionSchema>;

// ---------------------------------------------------------------------------
// A complete pipeline run over one submission (committed as a fixture)
// ---------------------------------------------------------------------------

export const PipelineRunSchema = z.object({
  submissionId: z.string(),
  runAt: z.string(),
  modelId: z.string(),
  promptVersions: z.record(z.string(), z.string()),
  rubricVersion: z.string(),
  sourceSha256: z.string(),
  redactions: z.array(RedactionSchema),
  cards: z.array(EvidenceCardSchema),
  probes: z.array(ProbeQuestionSchema),
  synthesis: SynthesisSchema,
  log: z.array(DecisionLogEntrySchema),
});
export type PipelineRun = z.infer<typeof PipelineRunSchema>;

// ---------------------------------------------------------------------------
// Human-side state (client only, localStorage). The AI cannot write any of
// this: card status transitions happen exclusively through UI actions.
// ---------------------------------------------------------------------------

export const CardStatus = z.enum(["unconfirmed", "confirmed", "edited", "rejected"]);
export type CardStatus = z.infer<typeof CardStatus>;

export const CardDispositionSchema = z.object({
  cardId: z.string(),
  status: CardStatus,
  editedClaim: z.string().nullable(),
  note: z.string().nullable(),
  ts: z.string(),
});
export type CardDisposition = z.infer<typeof CardDispositionSchema>;

export const ManualCardSchema = z.object({
  id: z.string(),
  competencyId: CompetencyId,
  claim: z.string(),
  note: z.string().nullable(),
  ts: z.string(),
});
export type ManualCard = z.infer<typeof ManualCardSchema>;

export const ReviewerStateSchema = z.object({
  submissionId: z.string(),
  dispositions: z.record(z.string(), CardDispositionSchema),
  manualCards: z.array(ManualCardSchema),
  probeDecisions: z.record(z.string(), z.enum(["kept", "discarded"])),
  humanLog: z.array(DecisionLogEntrySchema),
});
export type ReviewerState = z.infer<typeof ReviewerStateSchema>;

// ---------------------------------------------------------------------------
// Rubric
// ---------------------------------------------------------------------------

export const JdClaimSchema = z.object({
  id: z.string(),
  appendix: z.enum(["A", "B"]),
  section: z.string(),
  text: z.string(),
});
export type JdClaim = z.infer<typeof JdClaimSchema>;

export const CompetencySchema = z.object({
  id: CompetencyId,
  name: z.string(),
  anchor: z.string(),
  lookFor: z.string(),
  jdSources: z.array(z.string()).min(1),
});
export type Competency = z.infer<typeof CompetencySchema>;

export const RubricSchema = z.object({
  version: z.string(),
  role: z.string(),
  note: z.string(),
  substanceLadder: z.record(z.string(), z.string()),
  jdClaims: z.array(JdClaimSchema),
  competencies: z.array(CompetencySchema).length(6),
});
export type Rubric = z.infer<typeof RubricSchema>;
