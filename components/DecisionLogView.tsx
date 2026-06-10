"use client";

import { DecisionLogEntry, PipelineRun, ReviewerState, Submission } from "@/lib/types";

// The audit trail: every AI output and every human action, attributable and
// exportable. The mirror principle applies — nothing recorded here about a
// candidate's submission is invisible to that candidate on request.

export function DecisionLogView({
  submission,
  run,
  state,
}: {
  submission: Submission;
  run: PipelineRun;
  state: ReviewerState;
}) {
  const entries: DecisionLogEntry[] = [...run.log, ...state.humanLog].sort((a, b) =>
    a.ts.localeCompare(b.ts)
  );

  const dispositions = Object.values(state.dispositions);
  const rejected = dispositions.filter((d) => d.status === "rejected").length;
  const edited = dispositions.filter((d) => d.status === "edited").length;

  const exportJson = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            submission: { id: submission.id, candidateName: submission.candidateName },
            provenance: {
              modelId: run.modelId,
              promptVersions: run.promptVersions,
              rubricVersion: run.rubricVersion,
              sourceSha256: run.sourceSha256,
              runAt: run.runAt,
            },
            aiOutput: {
              cards: run.cards,
              probes: run.probes,
              synthesis: run.synthesis,
              redactions: run.redactions,
            },
            humanJudgment: state,
            log: entries,
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `second-reader-${submission.id}-review.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Run provenance
          </h3>
          <dl className="mt-2 space-y-1 font-mono text-[11.5px] text-ink-soft">
            <div>model: {run.modelId}</div>
            <div>
              prompts: ext {run.promptVersions.extractor} · ref {run.promptVersions.refuter} · prb{" "}
              {run.promptVersions.probes}
            </div>
            <div>rubric: v{run.rubricVersion}</div>
            <div>source sha256: {run.sourceSha256.slice(0, 16)}…</div>
            <div>run at: {run.runAt}</div>
            <div>redactions: {run.redactions.length} (regex, demo-grade)</div>
          </dl>
        </div>

        <div className="rounded-lg border border-line bg-surface p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Human override rate
          </h3>
          <p className="mt-2 text-2xl font-semibold">
            {rejected + edited}
            <span className="text-sm font-normal text-ink-soft">
              {" "}
              of {run.cards.length} AI cards corrected
            </span>
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-soft">
            {rejected} rejected · {edited} edited. A pipeline-quality signal:
            high override rates mean the extractor needs work, and the log shows
            exactly where.
          </p>
        </div>

        <div className="rounded-lg border border-line bg-surface p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Mirror principle
          </h3>
          <p className="mt-2 text-xs leading-5 text-ink-soft">
            Everything recorded here about this submission is available to the
            candidate on request — there is no hidden channel. Export the full
            record:
          </p>
          <button
            onClick={exportJson}
            className="mt-2 rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Export review record (JSON)
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-line bg-paper text-[11px] uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">Actor</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Card</th>
              <th className="px-4 py-2 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={i} className="border-b border-line/60 align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-2 font-mono text-[11px] text-ink-faint">
                  {entry.ts.replace("T", " ").slice(0, 19)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                      entry.actor === "human"
                        ? "bg-accent-soft text-accent"
                        : entry.actor === "ai"
                          ? "bg-flag-bg text-flag"
                          : "bg-paper text-ink-faint"
                    }`}
                  >
                    {entry.actor}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2">{entry.action}</td>
                <td className="px-4 py-2 font-mono text-[11px] text-ink-faint">
                  {entry.cardId ?? "—"}
                </td>
                <td className="px-4 py-2 leading-5 text-ink-soft">{entry.detail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] leading-5 text-ink-faint">
        Append-only by construction: AI entries are part of the committed run
        record; human entries accumulate locally and are never rewritten.
        Prototype persistence is browser localStorage — a deliberate cut,
        documented in DECISIONS.md; production would write to an authenticated,
        immutable store.
      </p>
    </div>
  );
}
