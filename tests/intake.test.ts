import { test } from "node:test";
import assert from "node:assert/strict";
import { intake } from "../lib/pipeline/intake";
import type { Submission } from "../lib/types";

function submission(text: string): Submission {
  return {
    id: "t",
    candidateName: "Anika Joshi",
    background: "consultant",
    format: "write-up",
    synthetic: true,
    syntheticNote: "synthetic",
    documents: [{ id: "d1", title: "Doc", kind: "write-up", text }],
  };
}

test("intake redacts direct identifiers: email, phone, profile link, name", () => {
  const { docs, redactions } = intake(
    submission(
      "Reach Anika at anika@example.com or 416-555-0199. Profile: https://linkedin.com/in/anika-joshi. Joshi led it."
    )
  );
  const out = docs[0].text;
  assert.ok(!out.includes("anika@example.com"), "email gone");
  assert.ok(!out.includes("416-555-0199"), "phone gone");
  assert.ok(!out.includes("linkedin.com/in/anika"), "profile link gone");
  assert.ok(!out.includes("Anika") && !out.includes("Joshi"), "name gone");
  assert.ok(out.includes("[email]") && out.includes("[phone]") && out.includes("[candidate]"));
  // The redaction map is escrowed for audit.
  const kinds = redactions.map((r) => r.kind);
  assert.ok(kinds.includes("email") && kinds.includes("phone") && kinds.includes("name-wordlist"));
});

test("intake normalizes CRLF to LF and trims", () => {
  const { docs } = intake(submission("line one\r\nline two   \r\n"));
  assert.ok(!docs[0].text.includes("\r"));
  assert.equal(docs[0].text, "line one\nline two");
});

test("sourceSha256 is a stable 64-char hex digest of the redacted text", () => {
  const a = intake(submission("Anika did the work for anika@example.com."));
  const b = intake(submission("Anika did the work for anika@example.com."));
  assert.match(a.sourceSha256, /^[0-9a-f]{64}$/);
  assert.equal(a.sourceSha256, b.sourceSha256, "deterministic for identical input");
});

test("documents with no identifiers produce no redactions", () => {
  const { redactions } = intake(submission("A purely descriptive sentence about workflows."));
  assert.equal(redactions.length, 0);
});
