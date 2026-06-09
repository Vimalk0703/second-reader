import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasApiKey } from "@/lib/pipeline/anthropic";
import { runPipeline } from "@/lib/pipeline/run";
import { getFixture } from "@/lib/fixtures";
import { rubric } from "@/lib/rubric";

export const maxDuration = 300;

// Live mode is deliberately narrow on the public deployment:
// - env-gated: without ANTHROPIC_API_KEY the route refuses politely;
// - fixture-only: it re-runs the pipeline on a known committed submission.
//   Arbitrary uploads are out of scope here (input surface + spend control);
//   local users can add fixtures and use `npm run pipeline` instead.
// - rate-limited: in-memory token bucket, demo-grade and disclosed as such
//   (per-instance; a real deployment would back this with shared storage).

const BodySchema = z.object({ submissionId: z.string().max(100) });

const WINDOW_MS = 10 * 60 * 1000;
const MAX_RUNS_PER_WINDOW = 3;
const recentRuns: number[] = [];

export async function POST(request: NextRequest) {
  if (!hasApiKey()) {
    return NextResponse.json(
      {
        error:
          "Live mode is disabled on this deployment (no ANTHROPIC_API_KEY). The app is running in demo mode with precomputed pipeline outputs.",
      },
      { status: 503 }
    );
  }

  const now = Date.now();
  while (recentRuns.length > 0 && now - recentRuns[0] > WINDOW_MS) {
    recentRuns.shift();
  }
  if (recentRuns.length >= MAX_RUNS_PER_WINDOW) {
    return NextResponse.json(
      { error: "Rate limit reached: at most 3 live runs per 10 minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Expected { submissionId: string }." }, { status: 400 });
  }

  const fixture = getFixture(parsed.data.submissionId);
  if (!fixture) {
    return NextResponse.json(
      { error: `Unknown submission "${parsed.data.submissionId}". Live mode re-runs known fixtures only.` },
      { status: 404 }
    );
  }

  recentRuns.push(now);
  try {
    const run = await runPipeline(fixture.submission, rubric);
    return NextResponse.json({ run });
  } catch (err) {
    // Fail loudly but without leaking internals.
    console.error("pipeline run failed", err);
    return NextResponse.json(
      { error: "Pipeline run failed. See server logs." },
      { status: 500 }
    );
  }
}
