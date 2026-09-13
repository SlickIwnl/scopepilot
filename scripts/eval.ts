import { pathToFileURL } from "node:url";
import { workflowFixtures, type DraftFixture } from "../src/eval/fixtures";
import { EVALUATION_CAVEAT, scoreDraft } from "../src/eval/scoring";

export function runFixtureEvaluation(
  fixtures: readonly DraftFixture[] = workflowFixtures,
  write: (line: string) => void = console.log,
): number {
  write(EVALUATION_CAVEAT);
  let passed = 0;
  for (const fixture of fixtures) {
    const result = scoreDraft(fixture.draft);
    const failures = result.failures.map((failure) => failure.split(":")[0]).sort();
    const matches = JSON.stringify(failures) === JSON.stringify([...fixture.expectedFailures].sort());
    if (matches) passed += 1;
    write(`${matches ? "PASS" : "FAIL"} ${fixture.id}: ${result.score}/100; ${fixture.expectedFailures.length ? "negative control" : "required positive"}`);
    for (const failure of result.failures) write(`  ${failure}`);
    if (!matches) write(`  Expected failed checks: ${fixture.expectedFailures.join(", ") || "none"}; observed: ${failures.join(", ") || "none"}`);
  }
  write(`${passed}/${fixtures.length} fixture expectations passed. Negative controls must fail their specified checks.`);
  return fixtures.length > 0 && passed === fixtures.length ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = runFixtureEvaluation();
}
