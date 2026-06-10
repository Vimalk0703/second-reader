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
          This tool gathers evidence and writes interview questions. It never
          scores or ranks anyone — you make every decision, and every decision
          is saved.
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
        <p className="text-sm text-ink-soft">
          Rubric v{rubric.version} · derived from the AI Builder job description
        </p>
      </div>

      <p className="max-w-3xl text-sm leading-6 text-ink-soft">
        Candidates can submit in any format — a low-code workflow, a slide
        pitch, a code repo. That keeps it fair across backgrounds, but it makes
        the submissions hard to compare. This tool reads each one against the
        same set of skills, so you can review them fairly without turning anyone
        into a number.
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

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
              {run ? (
                <span className="font-mono text-[11px] text-ink-faint">
                  Demo mode — saved results · {run.cards.length} cards
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
        <span className="font-semibold">How a review works:</span>{" "}
        the AI pulls out evidence — each point backed by an exact quote from the
        submission. A
        second AI then tries to poke holes in each point, and where they
        disagree, you decide. The interview questions and summary stay hidden
        until you&apos;ve reviewed every piece of evidence yourself. More on how
        it all works is in the{" "}
        <Link href="/transparency" className="underline">
          transparency note
        </Link>
        .
      </div>
    </div>
  );
}
