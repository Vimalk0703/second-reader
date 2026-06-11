import { test } from "node:test";
import assert from "node:assert/strict";
import { EvidenceCardSchema, SynthesisSchema } from "../lib/types";
import { ExtractorOutputSchema } from "../lib/pipeline/schemas";

const validCard = {
  id: "ev-01",
  competencyId: "C1",
  claim: "Built a working workflow",
  substance: "demonstrated",
  citation: { docId: "d1", quote: "the quote", start: 0, end: 9 },
  flags: [],
  refutation: null,
};

test("a well-formed evidence card parses", () => {
  assert.doesNotThrow(() => EvidenceCardSchema.parse(validCard));
});

test("structural no-score guarantee: a score field has nowhere to live", () => {
  // The data model cannot express a verdict. Even if an upstream caller tried
  // to attach a score, the schema strips it — there is no field for it.
  const parsed = EvidenceCardSchema.parse({ ...validCard, score: 99, rating: "A+" });
  assert.equal("score" in parsed, false);
  assert.equal("rating" in parsed, false);
});

test("invalid substance grades are rejected", () => {
  assert.throws(() => EvidenceCardSchema.parse({ ...validCard, substance: "excellent" }));
});

test("a citation cannot be omitted from a card", () => {
  const { citation, ...noCitation } = validCard;
  void citation;
  assert.throws(() => EvidenceCardSchema.parse(noCitation));
});

test("every synthesis paragraph must cite at least one evidence card", () => {
  assert.doesNotThrow(() =>
    SynthesisSchema.parse({ paragraphs: [{ text: "Backed by evidence.", citedCardIds: ["ev-01"] }] })
  );
  assert.throws(() =>
    SynthesisSchema.parse({ paragraphs: [{ text: "Unsupported claim.", citedCardIds: [] }] })
  );
});

test("the extractor contract accepts a valid claim and carries no verdict field", () => {
  const out = ExtractorOutputSchema.parse({
    claims: [
      {
        competencyId: "C3",
        claim: "Shipped a runnable artifact",
        docId: "d1",
        quote: "the quote",
        substance: "demonstrated",
        injectionSuspect: false,
        score: 5,
      },
    ],
  });
  assert.equal("score" in out.claims[0], false);
});
