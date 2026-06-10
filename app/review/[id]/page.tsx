import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewWorkbench } from "@/components/ReviewWorkbench";
import { getFixture } from "@/lib/fixtures";
import { hasApiKey } from "@/lib/pipeline/anthropic";
import { rubric } from "@/lib/rubric";

// Dynamic so liveModeAvailable reflects the runtime environment (the API key
// can be added or removed without a rebuild) and fixtures load per request.
export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fixture = getFixture(id);
  if (!fixture) notFound();

  if (!fixture.run) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-paper p-10 text-center">
        <h1 className="text-lg font-semibold">{fixture.submission.candidateName}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          The pipeline has not been run for this submission yet. Run{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">
            npm run pipeline {fixture.submission.id}
          </code>{" "}
          with an API key, then reload.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-accent underline">
          ← back to queue
        </Link>
      </div>
    );
  }

  return (
    <ReviewWorkbench
      submission={fixture.submission}
      run={fixture.run}
      rubric={rubric}
      liveModeAvailable={hasApiKey()}
    />
  );
}
