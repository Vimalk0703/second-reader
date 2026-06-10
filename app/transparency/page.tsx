import { rubric } from "@/lib/rubric";

export const dynamic = "force-dynamic";

// The candidate-facing page: what this system does with a submission, what it
// is structurally unable to do, and what stays human. Rendered from the same
// rubric file the pipeline uses, so this page cannot drift from the system it
// describes. Context: Ontario's Working for Workers Four Act, 2024 requires
// employers (25+ employees) to disclose AI use in screening, assessment, or
// selection in publicly advertised job postings as of January 1, 2026 —
// disclosure pages like this one are becoming table stakes, not a courtesy.

export default function TransparencyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          What this system does with your submission
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          If your case-study submission is reviewed with Second Reader, this
          page describes exactly what the AI does, what it cannot do, and what
          remains a human decision. It is written for you, the candidate.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold">What the AI does</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>
            <span className="font-medium">Reads your materials</span> after a
            redaction pass removes direct identifiers (emails, phone numbers,
            personal links, your name). The redaction map is kept for audit.
          </li>
          <li>
            <span className="font-medium">Extracts evidence</span> — specific,
            checkable claims about what your submission shows, each tied to a
            verbatim quote from your own materials. Quotes that cannot be
            matched exactly to your text are flagged as failures and excluded
            from any summary.
          </li>
          <li>
            <span className="font-medium">Argues against itself</span> — a
            second, independent AI pass tries to refute each extracted claim
            using only your materials. Disagreements between the two passes are
            shown to the human reviewer, never resolved automatically.
          </li>
          <li>
            <span className="font-medium">Drafts interview questions</span> from
            gaps in the evidence — so a weakness in your submission becomes a
            question you get to answer in person, not a silent deduction.
          </li>
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold">What the AI cannot do — by construction</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6">
          {[
            "It cannot score, rate, or rank you. No score field exists anywhere in the system's data model.",
            "It cannot reject you, recommend rejecting you, or compare you to another candidate. Hire/reject vocabulary is blocked in code; submissions are reviewed one at a time.",
            "It cannot make its summary visible to a reviewer before that reviewer has personally judged every piece of extracted evidence.",
            "It cannot act on instructions embedded in submission text. Content addressed to AI systems is surfaced to the reviewer as a finding instead.",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-contradicted">✕</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">What humans decide</h2>
        <p className="mt-3 text-sm leading-6">
          Everything that matters. A human reviewer confirms, edits, or rejects
          every piece of AI-extracted evidence, can add evidence the AI missed,
          chooses which interview questions to ask, and forms every conclusion
          about your candidacy. Every action — the AI&apos;s and the human&apos;s
          — is logged with attribution.
        </p>
        <div className="mt-3 rounded-md border border-accent/30 bg-accent-soft px-4 py-3 text-sm leading-6">
          <span className="font-semibold text-accent">Mirror principle:</span>{" "}
          nothing this system records about your submission is invisible to you.
          On request, you can see every extracted claim, every flag, every
          reviewer action, and the exact prompts and model version used.
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">What you are assessed against</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Six competencies, each derived from sentences in the published AI
          Builder job description (traceable by ID — reviewers see the same
          mapping):
        </p>
        <ul className="mt-3 space-y-2">
          {rubric.competencies.map((c) => (
            <li key={c.id} className="rounded-md border border-line bg-surface p-3">
              <p className="text-sm font-medium">
                <span className="font-mono text-[11px] text-ink-faint">{c.id}</span>{" "}
                {c.name}
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-soft">{c.anchor}</p>
              <p className="mt-1 font-mono text-[10px] text-ink-faint">
                sources: {c.jdSources.join(", ")}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-5 text-ink-faint">
          Evidence is graded only by substance — demonstrated (the artifact
          shows it), described (explained but not shown), asserted (claimed with
          nothing behind it) — never by polish, format, or background. A
          low-code workflow and a code repository are read on the same scale.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Honest limits</h2>
        <p className="mt-2 text-sm leading-6">
          Choosing which evidence to surface shapes the review even when humans
          decide — this system claims auditability, not neutrality. Redaction is
          currently pattern-based and cannot remove indirect signals like
          writing style. This is a prototype evaluated on synthetic submissions;
          before real use it needs fairness review by people qualified to give
          one, and testing for automation bias with real review panels.
        </p>
      </section>

      <p className="border-t border-line pt-4 text-xs text-ink-faint">
        Rubric v{rubric.version} · This page is generated from the same rubric
        file the pipeline runs on, so it cannot drift from the system it
        describes.
      </p>
    </div>
  );
}
