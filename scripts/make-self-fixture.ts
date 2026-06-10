// Builds the dogfood fixture: this repository's own README and DECISIONS,
// snapshotted as the third submission in the review queue. The panel can
// review this submission inside this submission.
//
//   npx tsx scripts/make-self-fixture.ts && npm run pipeline candidate-c-self

import fs from "node:fs";
import path from "node:path";
import { Submission } from "@/lib/types";

const root = process.cwd();

const submission: Submission = {
  id: "candidate-c-self",
  candidateName: "Vimalkumar Parthasarathy",
  background: "This case-study submission, reviewing itself (dogfood)",
  format: "Code repository (README + DECISIONS)",
  synthetic: false,
  syntheticNote:
    "Dogfood — these documents are this repository's actual README.md and DECISIONS.md, snapshotted when the pipeline ran. The one submission in the queue that is not fictional.",
  documents: [
    {
      id: "self-readme",
      title: "README.md",
      kind: "readme",
      text: fs.readFileSync(path.join(root, "README.md"), "utf8"),
    },
    {
      id: "self-decisions",
      title: "DECISIONS.md",
      kind: "write-up",
      text: fs.readFileSync(path.join(root, "DECISIONS.md"), "utf8"),
    },
  ],
};

const dir = path.join(root, "fixtures", "candidate-c-self");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
  path.join(dir, "submission.json"),
  JSON.stringify(submission, null, 2) + "\n"
);
console.log("Wrote fixtures/candidate-c-self/submission.json");
