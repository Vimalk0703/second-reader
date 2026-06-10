import { z } from "zod";
import { CompetencyId, RefuterVerdict, SubstanceGrade } from "@/lib/types";

// Contracts for what the model is allowed to return at each stage. These are
// narrower than the app types on purpose: the model proposes (docId, quote)
// pairs and our code locates offsets and assigns IDs. None of these schemas
// can express a score, rating, or recommendation.

export const ExtractorOutputSchema = z.object({
  claims: z.array(
    z.object({
      competencyId: CompetencyId,
      claim: z.string().min(1),
      docId: z.string(),
      quote: z.string().min(1),
      substance: SubstanceGrade,
      injectionSuspect: z.boolean(),
    })
  ),
});
export type ExtractorOutput = z.infer<typeof ExtractorOutputSchema>;

export const RefuterOutputSchema = z.object({
  verdicts: z.array(
    z.object({
      cardId: z.string(),
      verdict: RefuterVerdict,
      rationale: z.string().min(1),
      counterQuote: z
        .object({
          docId: z.string().describe("ID of the document containing the conflicting passage"),
          quote: z.string().min(1).describe("The conflicting passage, verbatim"),
        })
        .nullable()
        .describe(
          "null unless verdict is 'contradicted'. Never a bare string — always an object with docId and quote, or null."
        ),
    })
  ),
});
export type RefuterOutput = z.infer<typeof RefuterOutputSchema>;

export const ProbesOutputSchema = z.object({
  probes: z.array(
    z.object({
      competencyId: CompetencyId,
      gap: z.string().min(1),
      question: z.string().min(1),
      citedCardIds: z.array(z.string()),
    })
  ),
  synthesis: z.object({
    paragraphs: z
      .array(
        z.object({
          text: z.string().min(1),
          citedCardIds: z.array(z.string()).min(1),
        })
      )
      .min(1),
  }),
});
export type ProbesOutput = z.infer<typeof ProbesOutputSchema>;

// Verdict language the synthesis must never produce about a person — checked
// in code after generation, a decision boundary enforced outside the prompt.
//
// v1 of this guard banned WORDS (score, rank, hire…). It was wrong-shaped
// twice over, and the dogfood fixture proved it: a synthesis describing this
// very repository must be able to say "a score-free design" — banning the
// word forbids describing the thing the guard protects. v2 bans verdict
// PHRASES directed at the person, plus numeric ratings, in the synthesis's
// own voice (quoted spans exempt — quoting isn't asserting). History in
// DECISIONS.md, "What the evals caught."
export const BANNED_SYNTHESIS_PATTERNS: RegExp[] = [
  /\b(?:recommend|suggest|advise)\w*\s+(?:not\s+)?(?:hiring|rejecting|advancing|shortlisting)\b/i,
  /\bshould\s+(?:not\s+)?be\s+(?:hired|rejected|advanced|shortlisted|interviewed|screened out)\b/i,
  /\b(?:do not|don't)\s+(?:hire|advance|shortlist)\b/i,
  /\b(?:hire|reject|advance|shortlist)\s+(?:this|the)\s+(?:candidate|applicant|person)\b/i,
  /\b(?:score[ds]?|rated?|ranks?|ranked|grade[ds]?)\s+(?:this|the)\s+(?:candidate|applicant|submission|person)\b/i,
  /\b(?:score[ds]?|rated?|ranks?|ranked|grade[ds]?)\s+(?:her|him|them)\b/i,
  /\b\d+(?:\.\d+)?\s*(?:\/|out of)\s*(?:5|10|100)\b/i,
  /\b(?:top|strong|weak|exceptional|outstanding|poor)\s+(?:candidate|applicant|hire)\b/i,
  /\b(?:pass(?:es|ed)?|fail(?:s|ed)?)\s+(?:this|the)\s+(?:candidate|applicant|screen|bar)\b/i,
];

/**
 * Returns the first verdict phrase found in the synthesis's own voice, or
 * null. Spans inside quotation marks are stripped first: a synthesis may
 * verbatim-quote a submission that talks about scores, or reproduce a
 * flagged injection passage as evidence, without that being a verdict.
 */
export function findVerdictVocabulary(text: string): string | null {
  const ownVoice = text
    .replace(/"[^"]*"/g, " [quoted] ")
    .replace(/“[^”]*”/g, " [quoted] ")
    .replace(/'[^']*'/g, " [quoted] ");
  for (const pattern of BANNED_SYNTHESIS_PATTERNS) {
    const hit = ownVoice.match(pattern)?.[0];
    if (hit) return hit;
  }
  return null;
}
