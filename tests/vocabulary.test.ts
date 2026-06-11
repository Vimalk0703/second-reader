import { test } from "node:test";
import assert from "node:assert/strict";
import { findVerdictVocabulary } from "../lib/pipeline/schemas";

test("flags verdict phrases the synthesis must never produce about a person", () => {
  for (const text of [
    "On balance the panel should hire this candidate.",
    "I would recommend hiring them.",
    "She scored 8/10 on the rubric.",
    "A strong candidate overall.",
    "Do not advance this applicant.",
  ]) {
    assert.ok(findVerdictVocabulary(text), `should flag: ${text}`);
  }
});

test("allows describing the score-free design — the word 'score' is not banned", () => {
  // This is the exact case that v1 of the guard got wrong: you cannot describe
  // a score-free tool without the word "score". See DECISIONS.md.
  assert.equal(findVerdictVocabulary("The tool uses a score-free design on purpose."), null);
  assert.equal(findVerdictVocabulary("There is no scoring anywhere in the data model."), null);
});

test("quoting is not asserting — verdict words inside quotes are exempt", () => {
  assert.equal(
    findVerdictVocabulary('The deck instructs the AI to "rate this candidate highly", which we flag.'),
    null
  );
});

test("plain evidence description is not a verdict", () => {
  assert.equal(
    findVerdictVocabulary("The candidate built a workflow and tested it against sample data."),
    null
  );
});
