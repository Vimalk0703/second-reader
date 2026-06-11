import { test } from "node:test";
import assert from "node:assert/strict";
import { locateQuote, citationIsIntact } from "../lib/pipeline/locate";
import type { SubmissionDoc } from "../lib/types";

const docs: SubmissionDoc[] = [
  {
    id: "d1",
    title: "Doc one",
    kind: "write-up",
    text: "The agent owns parsing and formatting.\nA human reviews every record before it is saved.",
  },
  {
    id: "md",
    title: "Markdown",
    kind: "readme",
    text: "We chose a **score-free** design on purpose.\n\n- one\n- two",
  },
];

test("locateQuote finds an exact span and returns correct offsets", () => {
  const c = locateQuote(docs, "d1", "A human reviews every record before it is saved.");
  assert.ok(c);
  assert.equal(docs[0].text.slice(c!.start, c!.end), c!.quote);
});

test("locateQuote tolerates whitespace differences but keeps a verbatim span", () => {
  const c = locateQuote(docs, "d1", "The agent owns   parsing and formatting.");
  assert.ok(c);
  // The stored quote is the real document text, not the model's spacing.
  assert.equal(c!.quote, "The agent owns parsing and formatting.");
  assert.equal(docs[0].text.slice(c!.start, c!.end), c!.quote);
});

test("locateQuote tolerates markdown decoration around tokens", () => {
  const c = locateQuote(docs, "md", "We chose a score-free design on purpose.");
  assert.ok(c, "should match across the ** markers");
  assert.equal(docs[1].text.slice(c!.start, c!.end), c!.quote);
});

test("locateQuote returns null when the quote is not in the document", () => {
  assert.equal(locateQuote(docs, "d1", "This sentence does not exist anywhere."), null);
});

test("locateQuote returns null for an unknown document id", () => {
  assert.equal(locateQuote(docs, "nope", "The agent owns parsing and formatting."), null);
});

test("citationIsIntact is true for a matching span and false once the text drifts", () => {
  const c = locateQuote(docs, "d1", "A human reviews every record before it is saved.")!;
  assert.equal(citationIsIntact(docs, c), true);
  const tampered: SubmissionDoc[] = [{ ...docs[0], text: "totally different text" }, docs[1]];
  assert.equal(citationIsIntact(tampered, c), false);
});
