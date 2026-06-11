import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeToolInput } from "../lib/pipeline/anthropic";

// normalizeToolInput repairs the "model returned a JSON-stringified array/object
// instead of the real value" case (see DECISIONS.md, "what the evals caught").
// It must be lossless: parse what is clearly stringified JSON, leave everything
// else untouched, and never throw.

test("parses a stringified array into a real array", () => {
  assert.deepEqual(normalizeToolInput('[1, 2, 3]'), [1, 2, 3]);
});

test("parses a stringified object", () => {
  assert.deepEqual(normalizeToolInput('{"a": 1}'), { a: 1 });
});

test("recurses into nested stringified fields", () => {
  const input = { claims: '[{"competencyId": "C1"}]' };
  assert.deepEqual(normalizeToolInput(input), { claims: [{ competencyId: "C1" }] });
});

test("leaves an ordinary string unchanged", () => {
  assert.equal(normalizeToolInput("a normal claim sentence"), "a normal claim sentence");
});

test("malformed JSON falls through to the original string, never throws", () => {
  const broken = '[{"competencyId": "C1"';
  assert.doesNotThrow(() => normalizeToolInput(broken));
  assert.equal(normalizeToolInput(broken), broken);
});

test("repairs a stringified array with unescaped newlines inside a quote", () => {
  // The model sometimes copies multi-line source text into a quote without
  // escaping the newline, producing invalid JSON. The normalizer repairs it
  // losslessly rather than failing the whole stage.
  const broken = '[{"quote": "line one\nline two"}]';
  assert.deepEqual(normalizeToolInput(broken), [{ quote: "line one\nline two" }]);
});

test("unwraps a markdown-fenced JSON payload", () => {
  assert.deepEqual(normalizeToolInput('```json\n[{"a": 1}]\n```'), [{ a: 1 }]);
});

test("passes through real arrays and primitives", () => {
  assert.deepEqual(normalizeToolInput([{ a: 1 }]), [{ a: 1 }]);
  assert.equal(normalizeToolInput(42), 42);
  assert.equal(normalizeToolInput(null), null);
});
