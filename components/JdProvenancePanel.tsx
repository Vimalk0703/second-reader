"use client";

import { Competency, Rubric } from "@/lib/types";

// Slide-over showing where a rubric competency comes from: the verbatim job
// description sentences it was derived from, by stable claim ID. The rubric
// has provenance for the same reason evidence cards do — criteria you cannot
// trace are criteria you cannot defend.

export function JdProvenancePanel({
  competency,
  rubric,
  onClose,
}: {
  competency: Competency;
  rubric: Rubric;
  onClose: () => void;
}) {
  const claims = competency.jdSources
    .map((id) => rubric.jdClaims.find((c) => c.id === id))
    .filter((c) => c !== undefined);

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <button
        aria-label="Close provenance panel"
        className="absolute inset-0 bg-ink/30"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-line bg-surface p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] text-ink-faint">
              {competency.id} · rubric v{rubric.version}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{competency.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded border border-line px-2 py-1 text-sm text-ink-soft hover:bg-paper"
          >
            Close
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-ink-soft">{competency.anchor}</p>

        <div className="mt-4 rounded-md bg-paper px-3 py-2 text-xs leading-5 text-ink-soft">
          <span className="font-semibold">What reviewers look for:</span>{" "}
          {competency.lookFor}
        </div>

        <h3 className="mt-6 text-sm font-semibold">
          Derived from these job-description sentences
        </h3>
        <ul className="mt-2 space-y-3">
          {claims.map((claim) => (
            <li key={claim.id} className="rounded-md border border-line bg-paper p-3">
              <p className="font-mono text-[11px] text-ink-faint">
                {claim.id} · Appendix {claim.appendix} ·{" "}
                {claim.appendix === "A" ? "Senior Consultant" : "Manager"} ·{" "}
                {claim.section}
              </p>
              <blockquote className="mt-1 border-l-2 border-accent pl-3 text-sm leading-6">
                “{claim.text}”
              </blockquote>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs leading-5 text-ink-faint">
          {rubric.note}
        </p>
      </aside>
    </div>
  );
}
