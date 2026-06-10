"use client";

import { useState } from "react";
import { FlagBadge, StatusBadge, SubstanceBadge, VerdictBadge } from "@/components/badges";
import {
  CardStatus,
  Citation,
  CompetencyId,
  EvidenceCard,
  PipelineRun,
  ReviewerState,
  Rubric,
  Submission,
} from "@/lib/types";
import { SourcePane } from "./SourcePane";

type Selected = { citation: Citation; counter: boolean } | null;

export function EvidenceBoard({
  submission,
  run,
  rubric,
  state,
  onDisposition,
  onAddManualCard,
  onShowProvenance,
}: {
  submission: Submission;
  run: PipelineRun;
  rubric: Rubric;
  state: ReviewerState;
  onDisposition: (cardId: string, status: CardStatus, editedClaim?: string) => void;
  onAddManualCard: (competencyId: CompetencyId, claim: string) => void;
  onShowProvenance: (competencyId: CompetencyId) => void;
}) {
  const [filter, setFilter] = useState<CompetencyId | "all">("all");
  const [selected, setSelected] = useState<Selected>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [adding, setAdding] = useState(false);
  const [newClaim, setNewClaim] = useState("");
  const [newCompetency, setNewCompetency] = useState<CompetencyId>("C1");

  const cards = filter === "all" ? run.cards : run.cards.filter((c) => c.competencyId === filter);
  const manualCards =
    filter === "all"
      ? state.manualCards
      : state.manualCards.filter((c) => c.competencyId === filter);

  const countFor = (id: CompetencyId) => run.cards.filter((c) => c.competencyId === id).length;
  const statusOf = (cardId: string) => state.dispositions[cardId]?.status ?? "unconfirmed";

  const dispositionButtons = (card: EvidenceCard) => {
    const status = statusOf(card.id);
    if (editing === card.id) {
      return (
        <div className="mt-2 space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={2}
            className="w-full rounded border border-line-strong bg-surface p-2 text-sm"
            aria-label="Edit claim"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                onDisposition(card.id, "edited", editText.trim());
                setEditing(null);
              }}
              disabled={editText.trim().length === 0}
              className="rounded bg-accent px-2.5 py-1 text-xs font-medium text-white disabled:opacity-40"
            >
              Save edit
            </button>
            <button
              onClick={() => setEditing(null)}
              className="rounded border border-line px-2.5 py-1 text-xs text-ink-soft"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => onDisposition(card.id, "confirmed")}
          className={`rounded px-2.5 py-1 text-xs font-medium ${
            status === "confirmed"
              ? "bg-supported text-white"
              : "border border-line text-ink-soft hover:border-supported hover:text-supported"
          }`}
        >
          Confirm
        </button>
        <button
          onClick={() => {
            setEditing(card.id);
            setEditText(state.dispositions[card.id]?.editedClaim ?? card.claim);
          }}
          className={`rounded px-2.5 py-1 text-xs font-medium ${
            status === "edited"
              ? "bg-accent text-white"
              : "border border-line text-ink-soft hover:border-accent hover:text-accent"
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => onDisposition(card.id, "rejected")}
          className={`rounded px-2.5 py-1 text-xs font-medium ${
            status === "rejected"
              ? "bg-contradicted text-white"
              : "border border-line text-ink-soft hover:border-contradicted hover:text-contradicted"
          }`}
        >
          Reject
        </button>
        <span className="ml-auto">
          <StatusBadge status={status} />
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-[13rem_minmax(0,1fr)_minmax(0,26rem)] gap-4">
      {/* Competency rail */}
      <nav aria-label="Competencies" className="space-y-1">
        <button
          onClick={() => setFilter("all")}
          className={`block w-full rounded px-3 py-2 text-left text-sm ${
            filter === "all" ? "bg-accent text-white" : "hover:bg-accent-soft"
          }`}
        >
          All competencies
          <span className="float-right font-mono text-[11px] opacity-70">
            {run.cards.length}
          </span>
        </button>
        {rubric.competencies.map((comp) => (
          <div key={comp.id} className="group">
            <button
              onClick={() => setFilter(comp.id)}
              className={`block w-full rounded px-3 py-2 text-left text-sm leading-5 ${
                filter === comp.id ? "bg-accent text-white" : "hover:bg-accent-soft"
              }`}
            >
              <span className="font-mono text-[11px] opacity-70">{comp.id}</span>{" "}
              {comp.name}
              <span className="float-right font-mono text-[11px] opacity-70">
                {countFor(comp.id)}
              </span>
            </button>
            <button
              onClick={() => onShowProvenance(comp.id)}
              className="mt-0.5 w-full rounded px-3 py-0.5 text-left text-[11px] text-ink-faint underline-offset-2 hover:text-accent hover:underline"
            >
              where this comes from →
            </button>
          </div>
        ))}
        <p className="px-3 pt-3 text-[11px] leading-4 text-ink-faint">
          Few cards under a skill? That may mean the AI missed something, not
          that the candidate is weak. Add anything it missed with the button on
          the right.
        </p>
      </nav>

      {/* Cards */}
      <section aria-label="Evidence cards" className="min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-soft">
            {cards.length} evidence card{cards.length === 1 ? "" : "s"}
            {filter !== "all" && ` · ${filter}`}
          </h2>
          <button
            onClick={() => setAdding((v) => !v)}
            className="rounded border border-line px-2.5 py-1 text-xs text-ink-soft hover:border-accent hover:text-accent"
          >
            {adding ? "Cancel" : "+ Add evidence the AI missed"}
          </button>
        </div>

        {adding && (
          <div className="rounded-lg border border-accent/40 bg-accent-soft/40 p-3">
            <div className="flex gap-2">
              <select
                value={newCompetency}
                onChange={(e) => setNewCompetency(e.target.value as CompetencyId)}
                className="rounded border border-line bg-surface px-2 py-1 text-sm"
                aria-label="Competency for new evidence"
              >
                {rubric.competencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={newClaim}
              onChange={(e) => setNewClaim(e.target.value)}
              rows={2}
              placeholder="What did the candidate show? Write one clear, specific point."
              className="mt-2 w-full rounded border border-line bg-surface p-2 text-sm"
            />
            <button
              onClick={() => {
                onAddManualCard(newCompetency, newClaim.trim());
                setNewClaim("");
                setAdding(false);
              }}
              disabled={newClaim.trim().length === 0}
              className="mt-2 rounded bg-accent px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
            >
              Add this evidence (saved as yours)
            </button>
          </div>
        )}

        {cards.map((card) => {
          const status = statusOf(card.id);
          const displayClaim =
            status === "edited"
              ? (state.dispositions[card.id]?.editedClaim ?? card.claim)
              : card.claim;
          return (
            <article
              key={card.id}
              className={`rounded-lg border bg-surface p-4 shadow-sm ${
                status === "rejected"
                  ? "border-line opacity-60"
                  : card.flags.length > 0
                    ? "border-flag/50"
                    : "border-line"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-ink-faint">{card.id}</span>
                <span className="font-mono text-[11px] text-ink-faint">
                  {card.competencyId}
                </span>
                <SubstanceBadge grade={card.substance} />
                {card.refutation && <VerdictBadge verdict={card.refutation.verdict} />}
                {card.flags.map((f) => (
                  <FlagBadge key={f} flag={f} />
                ))}
              </div>

              <p className={`mt-2 text-sm font-medium leading-6 ${status === "rejected" ? "line-through" : ""}`}>
                {displayClaim}
                {status === "edited" && (
                  <span className="ml-2 align-middle text-[11px] font-normal text-accent">
                    (edited by reviewer — original: “{card.claim}”)
                  </span>
                )}
              </p>

              <button
                onClick={() => setSelected({ citation: card.citation, counter: false })}
                className="mt-2 block w-full rounded border border-line bg-paper px-3 py-2 text-left text-xs leading-5 text-ink-soft hover:border-accent"
                title="Show this quote in the submission"
              >
                “{card.citation.quote.length > 220 ? card.citation.quote.slice(0, 220) + "…" : card.citation.quote}”
                <span className="mt-1 block font-mono text-[10px] text-ink-faint">
                  {submission.documents.find((d) => d.id === card.citation.docId)?.title} · click to see it in the submission →
                </span>
              </button>

              {card.refutation && card.refutation.verdict !== "supported" && (
                <div
                  className={`mt-2 rounded px-3 py-2 text-xs leading-5 ${
                    card.refutation.verdict === "contradicted"
                      ? "bg-contradicted-bg text-contradicted"
                      : "bg-unverified-bg text-unverified"
                  }`}
                >
                  <span className="font-semibold">Skeptic:</span> {card.refutation.rationale}
                  {card.refutation.counterCitation && (
                    <button
                      onClick={() =>
                        setSelected({
                          citation: card.refutation!.counterCitation!,
                          counter: true,
                        })
                      }
                      className="mt-1 block underline underline-offset-2"
                    >
                      show the part that contradicts it →
                    </button>
                  )}
                </div>
              )}

              {dispositionButtons(card)}
            </article>
          );
        })}

        {manualCards.map((card) => (
          <article
            key={card.id}
            className="rounded-lg border border-accent/40 bg-surface p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-ink-faint">{card.id}</span>
              <span className="font-mono text-[11px] text-ink-faint">{card.competencyId}</span>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                added by reviewer
              </span>
            </div>
            <p className="mt-2 text-sm font-medium leading-6">{card.claim}</p>
          </article>
        ))}

        {cards.length === 0 && manualCards.length === 0 && (
          <div className="rounded-lg border border-dashed border-line-strong bg-paper p-6 text-center text-sm text-ink-soft">
            The AI didn&apos;t find evidence for this skill.
            <span className="block text-xs text-ink-faint">
              That may be the AI&apos;s limit, not the candidate&apos;s. Read the
              submission on the right and add anything it missed.
            </span>
          </div>
        )}
      </section>

      {/* Source pane */}
      <aside
        aria-label="Source documents"
        className="sticky top-6 h-[calc(100vh-8rem)] min-w-0 rounded-lg border border-line bg-surface p-4 shadow-sm"
      >
        <SourcePane submission={submission} selected={selected} />
      </aside>
    </div>
  );
}
