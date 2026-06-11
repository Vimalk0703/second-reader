import { test } from "node:test";
import assert from "node:assert/strict";
import { rubric, competencyById, jdClaimById } from "../lib/rubric";

test("the rubric has exactly six competencies and a version", () => {
  assert.equal(rubric.competencies.length, 6);
  assert.match(rubric.version, /^\d+\.\d+\.\d+$/);
  assert.deepEqual(
    rubric.competencies.map((c) => c.id),
    ["C1", "C2", "C3", "C4", "C5", "C6"]
  );
});

test("provenance integrity: every competency cites JD claim IDs that exist", () => {
  const known = new Set(rubric.jdClaims.map((c) => c.id));
  for (const comp of rubric.competencies) {
    assert.ok(comp.jdSources.length > 0, `${comp.id} must cite at least one JD claim`);
    for (const src of comp.jdSources) {
      assert.ok(known.has(src), `${comp.id} cites unknown JD claim ${src}`);
    }
  }
});

test("every JD claim is well-formed (id, appendix, text)", () => {
  for (const claim of rubric.jdClaims) {
    assert.match(claim.id, /^JD-[AB]-\d+$/);
    assert.ok(["A", "B"].includes(claim.appendix));
    assert.ok(claim.text.length > 10);
  }
});

test("lookup helpers resolve known ids", () => {
  assert.equal(competencyById("C2").id, "C2");
  assert.ok(jdClaimById(rubric.competencies[0].jdSources[0]));
  assert.equal(jdClaimById("JD-Z-99"), undefined);
});
