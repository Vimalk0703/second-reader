import { Citation, SubmissionDoc } from "@/lib/types";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Locate a model-proposed quote inside a document by exact string match.
 * Falls back once to a whitespace-tolerant match (the matched text — still
 * verbatim from the document — replaces the model's quote). Returns null if
 * the quote cannot be found verbatim: the caller flags the card as a
 * citation mismatch rather than repairing it silently.
 */
export function locateQuote(
  docs: SubmissionDoc[],
  docId: string,
  quote: string
): Citation | null {
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return null;

  const exact = doc.text.indexOf(quote);
  if (exact !== -1) {
    return { docId, quote, start: exact, end: exact + quote.length };
  }

  // Whitespace-tolerant fallback: same characters, flexible spacing/newlines.
  // A second pass also tolerates markdown decoration (emphasis, backticks,
  // list bullets, heading marks) that models tend to strip when quoting
  // markdown sources. In every case the stored quote is the matched document
  // text itself — verbatim from the source — so the exact-match guarantee
  // downstream is preserved.
  const attempts = [
    quote.split(/\s+/).filter(Boolean).map(escapeRegExp).join("\\s+"),
    quote
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => `[*_\`~]*${escapeRegExp(token)}[*_\`~]*`)
      .join("[\\s*_\`~#>|-]+"),
  ];
  for (const pattern of attempts) {
    try {
      const match = new RegExp(pattern).exec(doc.text);
      if (match) {
        return {
          docId,
          quote: match[0],
          start: match.index,
          end: match.index + match[0].length,
        };
      }
    } catch {
      // Pathological quote (e.g. enormous); treat as not found.
    }
  }
  return null;
}

/** The render-time integrity check: does the stored span still match the doc? */
export function citationIsIntact(
  docs: SubmissionDoc[],
  citation: Citation
): boolean {
  const doc = docs.find((d) => d.id === citation.docId);
  if (!doc) return false;
  return doc.text.slice(citation.start, citation.end) === citation.quote;
}
