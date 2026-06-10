// CLI: npm run pipeline <submission-id>
// Runs the real pipeline against a fixture submission and writes run.json.
// Requires ANTHROPIC_API_KEY (e.g. in .env.local).

import fs from "node:fs";
import path from "node:path";
import { rubric } from "@/lib/rubric";
import { runPipeline } from "@/lib/pipeline/run";
import { SubmissionSchema } from "@/lib/types";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  // .env.local is optional; the key may already be in the environment.
}

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: npm run pipeline <submission-id>");
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set (put it in .env.local). Aborting.");
    process.exit(1);
  }

  const dir = path.join(process.cwd(), "fixtures", id);
  const submission = SubmissionSchema.parse(
    JSON.parse(fs.readFileSync(path.join(dir, "submission.json"), "utf8"))
  );

  console.log(`Running pipeline for ${submission.id} (${submission.candidateName})…`);
  const started = Date.now();
  const run = await runPipeline(submission, rubric, (stage, message) => {
    console.log(`  [${stage}] ${message}`);
  });

  const outPath = path.join(dir, "run.json");
  fs.writeFileSync(outPath, JSON.stringify(run, null, 2) + "\n");
  console.log(
    `Done in ${((Date.now() - started) / 1000).toFixed(1)}s → ${path.relative(process.cwd(), outPath)}`
  );
  console.log(
    `  model ${run.modelId} · prompts ${JSON.stringify(run.promptVersions)} · rubric ${run.rubricVersion}`
  );
  console.log(
    `  ${run.cards.length} cards · ${run.probes.length} probes · ${run.redactions.length} redactions`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
