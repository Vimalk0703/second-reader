import Link from "next/link";
import { listFixtures } from "@/lib/fixtures";
import { rubric } from "@/lib/rubric";

export const dynamic = "force-dynamic";

export default function QueuePage() {
  const fixtures = listFixtures();

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
        <span className="font-semibold text-accent">
          No scores. No rankings. Reviewer decides.
        </span>{" "}
        <span className="text-ink-soft">
          Second Reader organizes evidence and drafts questions. Every judgment
          about a candidate is made by a human and logged.
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
        <p className="text-sm text-ink-soft">
          Rubric v{rubric.version} · derived from the AI Builder job description
        </p>
      </div>

      <p className="max-w-3xl text-sm leading-6 text-ink-soft">
        Three submissions, three formats — a low-code workflow with a deck, a
        slide pitch, and this tool&apos;s own repository. The point of the open
        format is fairness across backgrounds; the cost is that no two
        submissions look alike. The workbench makes them readable on one rubric
        without flattening them into a number.
      </p>

      <ul className="grid gap-4 md:grid-cols-3">
        {fixtures.map(({ submission, run }) => (
          <li
            key={submission.id}
            className="flex flex-col rounded-lg border border-line bg-surface p-5 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink-soft">
                {submission.format}
              </span>
            </div>
            <h2 className="text-lg font-semibold">{submission.candidateName}</h2>
            <p className="mt-1 flex-1 text-sm text-ink-soft">{submission.background}</p>

            <p className="mt-3 text-[11px] italic text-ink-faint">
              {submission.syntheticNote}
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              {run ? (
                <span className="font-mono text-[11px] text-ink-faint">
                  Demo mode — precomputed run · {run.cards.length} cards
                </span>
              ) : (
                <span className="font-mono text-[11px] text-unverified">
                  pipeline not yet run
                </span>
              )}
              <Link
                href={`/review/${submission.id}`}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                Open review
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-md border border-line bg-surface px-4 py-3 text-xs leading-5 text-ink-soft">
        <span className="font-semibold">How to read a board:</span> the AI
        extracts evidence cards (each one claim, one verbatim citation), a second
        AI pass tries to refute each card from the same materials, and
        disagreements are shown to you — never resolved automatically. Interview
        probes and the synthesis stay locked until you have dispositioned every
        card. The full pipeline, autonomy boundaries, and audit design are in the{" "}
        <Link href="/transparency" className="underline">
          transparency note
        </Link>
        .
      </div>
    </div>
  );
}
