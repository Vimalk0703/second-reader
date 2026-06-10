"use client";

import { useEffect, useRef, useState } from "react";
import { Citation, Submission } from "@/lib/types";

// Right-hand pane: the actual submission documents (post-redaction — exactly
// what the model saw). Selecting a card scrolls to and highlights the cited
// span. The highlight is rendered from stored offsets and re-verified against
// the text at render time; a span that no longer matches shows a warning
// instead of a highlight.

export function SourcePane({
  submission,
  selected,
}: {
  submission: Submission;
  selected: { citation: Citation; counter: boolean } | null;
}) {
  const [activeDocId, setActiveDocId] = useState(submission.documents[0]?.id);
  const markRef = useRef<HTMLElement>(null);

  // Derived-state pattern: when a new citation is selected, switch to its
  // document during render (no effect, no cascading renders).
  const [prevSelected, setPrevSelected] = useState(selected);
  if (selected !== prevSelected) {
    setPrevSelected(selected);
    if (selected) setActiveDocId(selected.citation.docId);
  }

  const scrollBoxRef = useRef<HTMLDivElement>(null);

  // Scroll only the pane's own scroll box — scrollIntoView would also scroll
  // the page itself, yanking the board out from under the reviewer. Scrolls
  // twice: once synchronously, once after layout settles (offsets measured
  // mid-commit can be wrong while the pane is still reflowing). Instant, not
  // smooth — animations are throttled in background tabs, and a highlight the
  // reviewer never reaches is worse than an unanimated jump.
  useEffect(() => {
    const scrollToMark = () => {
      const mark = markRef.current;
      const box = scrollBoxRef.current;
      if (mark && box) {
        box.scrollTop = Math.max(0, mark.offsetTop - box.clientHeight / 3);
      }
    };
    scrollToMark();
    const settle = setTimeout(scrollToMark, 80);
    return () => clearTimeout(settle);
  }, [selected, activeDocId]);

  const doc = submission.documents.find((d) => d.id === activeDocId);
  if (!doc) return null;

  const citation = selected && selected.citation.docId === doc.id ? selected.citation : null;
  const intact =
    citation !== null &&
    doc.text.slice(citation.start, citation.end) === citation.quote;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap gap-1 border-b border-line pb-2">
        {submission.documents.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDocId(d.id)}
            className={`rounded px-2 py-1 text-[12px] ${
              d.id === activeDocId
                ? "bg-accent text-white"
                : "bg-paper text-ink-soft hover:bg-accent-soft"
            }`}
          >
            {d.title}
          </button>
        ))}
      </div>

      <p className="mt-2 text-[10.5px] text-ink-faint">
        Shown post-redaction — exactly the text the model read. The original is
        retained with the escrowed redaction map.
      </p>

      {citation && !intact && (
        <div className="mt-2 rounded border border-contradicted/40 bg-contradicted-bg px-3 py-2 text-xs text-contradicted">
          This card&apos;s quote could not be matched verbatim in the source —
          the citation is flagged and the card is excluded from the synthesis.
        </div>
      )}

      <div
        ref={scrollBoxRef}
        className="relative mt-3 flex-1 overflow-y-auto whitespace-pre-wrap font-mono text-[12.5px] leading-6 text-ink"
      >
        {citation && intact ? (
          <>
            {doc.text.slice(0, citation.start)}
            <mark
              ref={markRef}
              className={`citation ${selected?.counter ? "counter" : ""}`}
            >
              {citation.quote}
            </mark>
            {doc.text.slice(citation.end)}
          </>
        ) : (
          doc.text
        )}
      </div>
    </div>
  );
}
