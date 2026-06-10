"use client";

import { PipelineRun, ReviewerState, Rubric } from "@/lib/types";

// Interview probes and the synthesis draft. Both are AI drafts and both are
// gated: nothing here is meant to be read until the human has dispositioned
// every evidence card — judgment first, summary second, to blunt anchoring.

export function ProbeSheet({
  run,
  rubric,
  state,
  unlocked,
  remaining,
  onDecideProbe,
}: {
  run: PipelineRun;
  rubric: Rubric;
  state: ReviewerState;
  unlocked: boolean;
  remaining: number;
  onDecideProbe: (probeId: string, decision: "kept" | "discarded") => void;
}) {
  if (!unlocked) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-paper p-10 text-center">
        <p className="text-2xl">🔒</p>
        <h2 className="mt-2 text-lg font-semibold">
          Probes and synthesis are locked
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
          {remaining} evidence card{remaining === 1 ? "" : "s"} still need your
          confirm / edit / reject. The AI&apos;s summary stays out of sight until
          you have judged the evidence yourself — that ordering is the point.
        </p>
      </div>
    );
  }

  const competencyName = (id: string) =>
    rubric.competencies.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section aria-label="Interview probes">
        <h2 className="text-sm font-semibold text-ink-soft">
          Interview probes — drafted from evidence gaps
        </h2>
        <p className="mt-1 text-xs leading-5 text-ink-faint">
          Keep the ones worth the panel&apos;s time; discard the rest. Kept
          probes are your interview plan, and every keep/discard is logged.
        </p>
        <ul className="mt-3 space-y-3">
          {run.probes.map((probe) => {
            const decision = state.probeDecisions[probe.id];
            return (
              <li
                key={probe.id}
                className={`rounded-lg border bg-surface p-4 shadow-sm ${
                  decision === "discarded" ? "border-line opacity-50" : "border-line"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-ink-faint">{probe.id}</span>
                  <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] text-ink-soft">
                    {probe.competencyId} · {competencyName(probe.competencyId)}
                  </span>
                  {probe.citedCardIds.map((id) => (
                    <span key={id} className="font-mono text-[11px] text-accent">
                      {id}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-faint">Gap: {probe.gap}</p>
                <p className={`mt-1 text-sm leading-6 ${decision === "discarded" ? "line-through" : ""}`}>
                  {probe.question}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onDecideProbe(probe.id, "kept")}
                    className={`rounded px-2.5 py-1 text-xs font-medium ${
                      decision === "kept"
                        ? "bg-supported text-white"
                        : "border border-line text-ink-soft hover:border-supported hover:text-supported"
                    }`}
                  >
                    Keep for interview
                  </button>
                  <button
                    onClick={() => onDecideProbe(probe.id, "discarded")}
                    className={`rounded px-2.5 py-1 text-xs font-medium ${
                      decision === "discarded"
                        ? "bg-ink-soft text-white"
                        : "border border-line text-ink-soft hover:border-ink-soft"
                    }`}
                  >
                    Discard
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Synthesis draft">
        <h2 className="text-sm font-semibold text-ink-soft">
          Synthesis draft — every sentence cites cards you judged
        </h2>
        <p className="mt-1 text-xs leading-5 text-ink-faint">
          An AI draft for the panel write-up, not a verdict. It cannot contain
          scores, rankings, or hire/reject language — that vocabulary is blocked
          in code, not just in the prompt. Cards you rejected are listed so the
          draft can be read against your judgment.
        </p>
        <div className="mt-3 space-y-3">
          {run.synthesis.paragraphs.map((para, i) => {
            const rejectedCited = para.citedCardIds.filter(
              (id) => state.dispositions[id]?.status === "rejected"
            );
            return (
              <div key={i} className="rounded-lg border border-line bg-surface p-4 shadow-sm">
                <p className="text-sm leading-7">{para.text}</p>
                <p className="mt-2 font-mono text-[11px] text-ink-faint">
                  cites: {para.citedCardIds.join(", ")}
                </p>
                {rejectedCited.length > 0 && (
                  <p className="mt-1 rounded bg-contradicted-bg px-2 py-1 text-[11px] text-contradicted">
                    Caution: you rejected {rejectedCited.join(", ")} — weigh this
                    paragraph accordingly.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
