import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import type { WorkflowGenerationDependencies } from "../src/agent/workflow";
import { runLiveEvaluation } from "../src/eval/live";
import { EVALUATION_CAVEAT } from "../src/eval/scoring";

export async function runLiveCli(
  args: readonly string[],
  dependencies: WorkflowGenerationDependencies & { write?: (line: string) => void } = {},
): Promise<number> {
  const write = dependencies.write ?? console.log;
  try {
    const { values, tokens } = parseArgs({
      args: [...args],
      options: { "allow-live": { type: "boolean" }, limit: { type: "string" } },
      strict: true,
      allowPositionals: false,
      tokens: true,
    });
    if (tokens.length !== 2 || !values.limit || !/^[1-3]$/.test(values.limit)) {
      throw new Error("Invalid arguments");
    }
    const result = await runLiveEvaluation({ allowLive: values["allow-live"], limit: Number(values.limit) }, dependencies);
    write(EVALUATION_CAVEAT);
    result.results.forEach((score, index) => {
      write(`${score.passed ? "PASS" : "FAIL"} live attempt ${index + 1}: ${score.score}/100`);
      score.failures.forEach(write);
    });
    write(`${result.attempts} workflow attempt(s); stopped on first failure; no automatic retries.`);
    return result.passed ? 0 : 1;
  } catch {
    write("Live evaluation refused or setup failed. Use: npm run eval:live -- --allow-live --limit=1 (limit 1-3). Check AWS configuration; no automatic retry.");
    return 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = await runLiveCli(process.argv.slice(2));
}
