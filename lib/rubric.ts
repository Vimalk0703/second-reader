import rubricJson from "@/rubric/rubric.json";
import { Competency, CompetencyId, JdClaim, Rubric, RubricSchema } from "@/lib/types";

// Parsed once at module load; an invalid rubric fails the build, not a review.
export const rubric: Rubric = RubricSchema.parse(rubricJson);

export function competencyById(id: CompetencyId): Competency {
  const found = rubric.competencies.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown competency ${id}`);
  return found;
}

export function jdClaimById(id: string): JdClaim | undefined {
  return rubric.jdClaims.find((c) => c.id === id);
}
