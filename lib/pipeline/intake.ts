import { createHash } from "node:crypto";
import { Redaction, Submission, SubmissionDoc } from "@/lib/types";

// S0 — deterministic intake. No model judgment happens here, so no human gate
// is needed. Normalizes text and applies demo-grade regex redaction so later
// stages never see direct identifiers. The redaction map is escrowed in the
// run output for auditability.
//
// Known limit, on purpose (see DECISIONS.md): regex redaction removes direct
// identifiers only. Prose style, project choices, and vocabulary can still
// proxy for demographics — a real deployment needs an LLM redaction pass and
// a privacy review before touching non-synthetic data.

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const PHONE = /(\+?\d{1,2}[\s.-])?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g;
const PERSONAL_URL = /https?:\/\/(www\.)?(linkedin\.com|github\.com|twitter\.com|x\.com)\/[^\s)]+/g;

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
}

function redactDoc(
  doc: SubmissionDoc,
  nameParts: string[]
): { text: string; redactions: Redaction[] } {
  let text = normalize(doc.text);
  const redactions: Redaction[] = [];

  const apply = (
    pattern: RegExp,
    kind: Redaction["kind"],
    replacement: string
  ) => {
    const matches = text.match(pattern);
    if (!matches) return;
    const unique = [...new Set(matches)];
    for (const original of unique) {
      const count = matches.filter((m) => m === original).length;
      text = text.split(original).join(replacement);
      redactions.push({ docId: doc.id, kind, original, replacement, count });
    }
  };

  apply(EMAIL, "email", "[email]");
  apply(PHONE, "phone", "[phone]");
  apply(PERSONAL_URL, "url-personal", "[profile-link]");

  for (const part of nameParts) {
    if (part.length < 3) continue;
    const pattern = new RegExp(`\\b${part}\\b`, "gi");
    const matches = text.match(pattern);
    if (!matches) continue;
    text = text.replace(pattern, "[candidate]");
    redactions.push({
      docId: doc.id,
      kind: "name-wordlist",
      original: part,
      replacement: "[candidate]",
      count: matches.length,
    });
  }

  return { text, redactions };
}

export interface IntakeResult {
  docs: SubmissionDoc[];
  redactions: Redaction[];
  sourceSha256: string;
}

export function intake(submission: Submission): IntakeResult {
  const nameParts = submission.candidateName.split(/\s+/);
  const docs: SubmissionDoc[] = [];
  const redactions: Redaction[] = [];

  for (const doc of submission.documents) {
    const result = redactDoc(doc, nameParts);
    docs.push({ ...doc, text: result.text });
    redactions.push(...result.redactions);
  }

  const sourceSha256 = createHash("sha256")
    .update(docs.map((d) => `${d.id}\n${d.text}`).join("\n---\n"))
    .digest("hex");

  return { docs, redactions, sourceSha256 };
}
