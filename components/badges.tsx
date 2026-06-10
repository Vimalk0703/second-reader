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
          ? "The artifact itself shows this"
          : grade === "described"
            ? "Mechanism explained, artifact doesn't show it"
            : "Claim with nothing behind it"
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
      title="Verdict of the adversarial second pass (skeptic) on this card"
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
          ? "This passage addresses AI systems directly — extracted as a finding, not obeyed"
          : "The model's quote could not be located verbatim in the source — excluded from synthesis"
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
