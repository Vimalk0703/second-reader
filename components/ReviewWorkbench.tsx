"use client";

import { useMemo, useState } from "react";
import { EvidenceBoard } from "@/components/EvidenceBoard";
import { JdProvenancePanel } from "@/components/JdProvenancePanel";
import { ProbeSheet } from "@/components/ProbeSheet";
import { DecisionLogView } from "@/components/DecisionLogView";
import { useReviewerState } from "@/lib/reviewer-state";
import {
  CompetencyId,
  PipelineRun,
  PipelineRunSchema,
  Rubric,
  Submission,
} from "@/lib/types";

type Tab = "board" | "probes" | "log";

export function ReviewWorkbench({
  submission,
  run: committedRun,
  rubric,
  liveModeAvailable,
}: {
  submission: Submission;
  run: PipelineRun;
  rubric: Rubric;
  liveModeAvailable: boolean;
}) {
  const [tab, setTab] = useState<Tab>("board");
  const [provenanceFor, setProvenanceFor] = useState<CompetencyId | null>(null);
  const [liveRun, setLiveRun] = useState<PipelineRun | null>(null);
  const [liveStatus, setLiveStatus] = useState<"idle" | "running" | "error">("idle");
  const [liveError, setLiveError] = useState<string | null>(null);

  // A live re-run is viewed ephemerally: it never overwrites the committed
  // demo fixture, and reviewer judgments on it are not persisted.
  const run = liveRun ?? committedRun;
  const { state, disposition, addManualCard, decideProbe, reset } = useReviewerState(
    submission.id,
    liveRun === null
  );

  const remaining = useMemo(
    () =>
      run.cards.filter((c) => (state.dispositions[c.id]?.status ?? "unconfirmed") === "unconfirmed")
        .length,
    [run.cards, state.dispositions]
  );
  const unlocked = remaining === 0;

  const rerunLive = async () => {
    setLiveStatus("running");
    setLiveError(null);
    try {
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setLiveRun(PipelineRunSchema.parse(body.run));
      setLiveStatus("idle");
      setTab("board");
    } catch (err) {
      setLiveStatus("error");
      setLiveError(err instanceof Error ? err.message : "Live run failed.");
    }
  };

  const competency = provenanceFor
    ? rubric.competencies.find((c) => c.id === provenanceFor)
    : undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {submission.candidateName}
            </h1>
            <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink-soft">
              {submission.format}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">{submission.background}</p>
          <p className="mt-0.5 text-[11px] italic text-ink-faint">{submission.syntheticNote}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 font-mono text-[11px] ${
                liveRun
                  ? "bg-unverified-bg text-unverified"
                  : "border border-line bg-paper text-ink-faint"
              }`}
              title={`model ${run.modelId} · rubric v${run.rubricVersion}`}
            >
              {liveRun
                ? "Live run — ephemeral, not persisted"
                : "Demo mode — precomputed pipeline run"}
            </span>
            <button
              onClick={rerunLive}
              disabled={!liveModeAvailable || liveStatus === "running"}
              title={
                liveModeAvailable
                  ? "Re-run the full pipeline against this submission now (~60s)"
                  : "Live mode is disabled on this deployment (no API key). Demo mode is fully functional."
              }
              className="rounded-md border border-accent px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft disabled:cursor-not-allowed disabled:border-line disabled:text-ink-faint"
            >
              {liveStatus === "running" ? "Running S1→S3… (~60s)" : "Re-run pipeline (live)"}
            </button>
          </div>
          {liveStatus === "error" && (
            <p className="max-w-sm text-right text-[11px] text-contradicted">{liveError}</p>
          )}
          {liveRun && (
            <button
              onClick={() => {
                setLiveRun(null);
                setLiveStatus("idle");
              }}
              className="text-[11px] text-ink-faint underline underline-offset-2"
            >
              back to committed demo run
            </button>
          )}
        </div>
      </div>

      {/* Tabs + progress */}
      <div className="flex items-center justify-between border-b border-line">
        <div className="flex gap-1">
          {(
            [
              ["board", "Evidence board"],
              ["probes", unlocked ? "Probe sheet + synthesis" : "Probe sheet 🔒"],
              ["log", "Decision log"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-t-md px-4 py-2 text-sm ${
                tab === key
                  ? "border border-b-0 border-line bg-surface font-medium"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 pb-1">
          <span className="text-xs text-ink-soft">
            {run.cards.length - remaining} of {run.cards.length} cards dispositioned
          </span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-line">
            <div
              className="h-full bg-accent transition-all"
              style={{
                width: `${run.cards.length === 0 ? 0 : ((run.cards.length - remaining) / run.cards.length) * 100}%`,
              }}
            />
          </div>
          <button
            onClick={reset}
            className="text-[11px] text-ink-faint underline underline-offset-2"
            title="Clear your judgments for this submission (localStorage)"
          >
            reset
          </button>
        </div>
      </div>

      {tab === "board" && (
        <EvidenceBoard
          submission={submission}
          run={run}
          rubric={rubric}
          state={state}
          onDisposition={disposition}
          onAddManualCard={(competencyId, claim) => addManualCard(competencyId, claim, null)}
          onShowProvenance={setProvenanceFor}
        />
      )}
      {tab === "probes" && (
        <ProbeSheet
          run={run}
          rubric={rubric}
          state={state}
          unlocked={unlocked}
          remaining={remaining}
          onDecideProbe={decideProbe}
        />
      )}
      {tab === "log" && <DecisionLogView submission={submission} run={run} state={state} />}

      {competency && (
        <JdProvenancePanel
          competency={competency}
          rubric={rubric}
          onClose={() => setProvenanceFor(null)}
        />
      )}
    </div>
  );
}
