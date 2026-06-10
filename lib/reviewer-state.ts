"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CardStatus,
  CompetencyId,
  DecisionLogEntry,
  ManualCard,
  ReviewerState,
  ReviewerStateSchema,
} from "@/lib/types";

// All human judgment lives here, client-side, persisted to localStorage and
// exportable as JSON. The AI pipeline cannot reach this state: card status
// transitions exist only as UI actions. Prototype-grade persistence by design
// (see DECISIONS.md) — a real deployment would put this behind auth on a DB.

function emptyState(submissionId: string): ReviewerState {
  return {
    submissionId,
    dispositions: {},
    manualCards: [],
    probeDecisions: {},
    humanLog: [],
  };
}

function storageKey(submissionId: string) {
  return `second-reader:${submissionId}`;
}

export function useReviewerState(submissionId: string, persist: boolean) {
  const [state, setState] = useState<ReviewerState>(() => emptyState(submissionId));
  const [loaded, setLoaded] = useState(false);

  // One-time hydration from localStorage after mount. Deliberately an effect:
  // reading storage during render would mismatch the server-rendered HTML.
  // The cost is a single extra render on mount, accepted.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!persist) {
      setState(emptyState(submissionId));
      setLoaded(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(storageKey(submissionId));
      if (raw) {
        const parsed = ReviewerStateSchema.safeParse(JSON.parse(raw));
        if (parsed.success) setState(parsed.data);
      }
    } catch {
      // Corrupt local state falls back to empty — losing prototype state is
      // better than crashing the review.
    }
    setLoaded(true);
  }, [submissionId, persist]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const update = useCallback(
    (mutate: (prev: ReviewerState) => ReviewerState) => {
      setState((prev) => {
        const next = mutate(prev);
        if (persist) {
          try {
            window.localStorage.setItem(storageKey(submissionId), JSON.stringify(next));
          } catch {
            // Quota or privacy mode: keep working in memory.
          }
        }
        return next;
      });
    },
    [submissionId, persist]
  );

  const log = (action: string, cardId: string | null, detail: string | null): DecisionLogEntry => ({
    ts: new Date().toISOString(),
    actor: "human",
    action,
    cardId,
    detail,
  });

  const disposition = useCallback(
    (cardId: string, status: CardStatus, editedClaim?: string, note?: string) => {
      update((prev) => ({
        ...prev,
        dispositions: {
          ...prev.dispositions,
          [cardId]: {
            cardId,
            status,
            editedClaim: editedClaim ?? null,
            note: note ?? null,
            ts: new Date().toISOString(),
          },
        },
        humanLog: [
          ...prev.humanLog,
          log(
            `card ${status}`,
            cardId,
            status === "edited" ? `Claim edited to: "${editedClaim ?? ""}"` : note ?? null
          ),
        ],
      }));
    },
    [update]
  );

  const addManualCard = useCallback(
    (competencyId: CompetencyId, claim: string, note: string | null) => {
      update((prev) => {
        const card: ManualCard = {
          id: `mc-${String(prev.manualCards.length + 1).padStart(2, "0")}`,
          competencyId,
          claim,
          note,
          ts: new Date().toISOString(),
        };
        return {
          ...prev,
          manualCards: [...prev.manualCards, card],
          humanLog: [
            ...prev.humanLog,
            log("manual card added", card.id, `${competencyId}: ${claim}`),
          ],
        };
      });
    },
    [update]
  );

  const decideProbe = useCallback(
    (probeId: string, decision: "kept" | "discarded") => {
      update((prev) => ({
        ...prev,
        probeDecisions: { ...prev.probeDecisions, [probeId]: decision },
        humanLog: [...prev.humanLog, log(`probe ${decision}`, probeId, null)],
      }));
    },
    [update]
  );

  const reset = useCallback(() => {
    update(() => emptyState(submissionId));
    if (persist) {
      try {
        window.localStorage.removeItem(storageKey(submissionId));
      } catch {
        // ignore
      }
    }
  }, [update, submissionId, persist]);

  return { state, loaded, disposition, addManualCard, decideProbe, reset };
}
