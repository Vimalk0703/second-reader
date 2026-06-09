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
        .object({ docId: z.string(), quote: z.string().min(1) })
        .nullable(),
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

// Verdict vocabulary the synthesis must never use about a person. Checked in
// code after generation — a decision boundary enforced outside the prompt.
export const BANNED_SYNTHESIS_PATTERN =
  /\b(hire|reject|rejected|pass|fail|score[sd]?|scoring|rating|ranked?|ranking|recommend(s|ed|ation)?|top candidate|strong candidate|weak candidate)\b/i;
