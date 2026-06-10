import { CardFlag, CardStatus, RefuterVerdict, SubstanceGrade } from "@/lib/types";

export function SubstanceBadge({ grade }: { grade: SubstanceGrade }) {
  const styles: Record<SubstanceGrade, string> = {
    demonstrated: "bg-accent text-white border-accent",
    described: "bg-accent-soft text-accent border-accent/40",
    asserted: "bg-paper text-ink-soft border-line-strong border-dashed",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[grade]}`}
      title={
        grade === "demonstrated"
          ? "They actually showed it in their work"
          : grade === "described"
            ? "They explained how, but didn't show it"
            : "Just a claim, with nothing to back it up"
      }
    >
      {grade}
    </span>
  );
}

export function VerdictBadge({ verdict }: { verdict: RefuterVerdict }) {
  const styles: Record<RefuterVerdict, string> = {
    supported: "bg-supported-bg text-supported",
    unverified: "bg-unverified-bg text-unverified",
    contradicted: "bg-contradicted-bg text-contradicted",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles[verdict]}`}
      title="What the skeptic (the second AI) concluded about this card"
    >
      {verdict}
    </span>
  );
}

export function FlagBadge({ flag }: { flag: CardFlag }) {
  return (
    <span
      className="rounded-full bg-flag-bg px-2 py-0.5 text-[11px] font-semibold text-flag"
      title={
        flag === "injection-suspect"
          ? "This text tries to give the AI instructions — flagged for you, not obeyed"
          : "The AI's quote didn't exactly match the submission, so this card is set aside"
      }
    >
      ⚑ {flag}
    </span>
  );
}

export function StatusBadge({ status }: { status: CardStatus }) {
  const styles: Record<CardStatus, string> = {
    unconfirmed: "bg-paper text-ink-faint border border-line",
    confirmed: "bg-supported-bg text-supported",
    edited: "bg-accent-soft text-accent",
    rejected: "bg-contradicted-bg text-contradicted line-through",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
