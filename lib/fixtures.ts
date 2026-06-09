import fs from "node:fs";
import path from "node:path";
import {
  PipelineRun,
  PipelineRunSchema,
  Submission,
  SubmissionSchema,
} from "@/lib/types";

// Server-side fixture loading. Demo mode is the default for the whole app:
// every pipeline output here was produced by a real run of the pipeline
// (scripts/run-pipeline.ts) and committed, so the public deployment needs no
// API key and cannot cold-fail. Disclosed in the UI as "Demo mode".

export interface Fixture {
  submission: Submission;
  run: PipelineRun | null;
}

const FIXTURES_DIR = path.join(process.cwd(), "fixtures");

let cache: Fixture[] | null = null;

export function listFixtures(): Fixture[] {
  if (cache) return cache;
  const entries = fs
    .readdirSync(FIXTURES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  cache = entries.map((dir) => {
    const submission = SubmissionSchema.parse(
      JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, dir, "submission.json"), "utf8"))
    );
    const runPath = path.join(FIXTURES_DIR, dir, "run.json");
    const run = fs.existsSync(runPath)
      ? PipelineRunSchema.parse(JSON.parse(fs.readFileSync(runPath, "utf8")))
      : null;
    return { submission, run };
  });
  return cache;
}

export function getFixture(id: string): Fixture | undefined {
  return listFixtures().find((f) => f.submission.id === id);
}
