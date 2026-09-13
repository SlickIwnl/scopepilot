# Task 6 Report

## Status

**DONE_WITH_CONCERNS**. All required offline checks pass. Remaining concerns are the intentionally unverified live provider/model behavior, narrow heuristic evaluation, Chromium-only browser coverage, and the existing MVP deployment limitations. There are no outstanding blocked checks from the brief.

Verified on **2026-09-10**, in the project directory, with Node **v26.3.1**, npm **11.17.0**, Vitest **5.0.0**, and Vite **8.2.2**.

The task brief was the first file read. The existing plan, contracts, catalog, agent factory/workflow, Fastify app/service/server and dependency injection, React UI/client/styles, test suites, scripts, environment example, and test/build configuration were inspected before implementation. Tasks 1-5 were preserved; their 35 baseline tests remain unchanged and pass within the final 83-test suite. No commits, staging, publishing, deployment, dependency updates, or live Bedrock calls were performed.

## Delivered

- Deterministic shape validation and seven observable quality checks, with actionable failure messages and an explicit grounding/model-quality caveat.
- Five offline fixtures: two positives and three negative controls. A run passes only if each exact expected failed-check set matches. Empty or mismatched suites fail.
- Separate `eval:live` CLI requiring `--allow-live` and `--limit=1`, `2`, or `3`; a strict Zod options boundary; sequential request-scoped agents; fail-fast behavior; safe output; no retries.
- SDK-level single-model-call protection, including implicit structured-output repair loops, with fake-model tests using the real Strands Agent loop.
- A separate loopback-only offline demo and fixture API using existing DI, with no production fixture switch and no browser response mocking.
- Six E2E cases across desktop Chromium and mobile Chromium emulation: all draft fields, request/response contracts, checkbox locality/reset, generation failure/recovery, text-only markup rendering, and responsive layout.
- Setup, AWS environment/credential guidance, demo instructions, architecture, evaluation boundaries, and deployment limitations in README; standard MIT license attributed to ScopePilot contributors.

## Files Changed

The repository started without commits and all source was untracked. Git diff cannot distinguish this task from prior work. This is the explicit Task 6 file inventory, not the entire worktree:

| File | Task 6 action |
| --- | --- |
| `LICENSE` | Added MIT license, 2026 ScopePilot contributors. |
| `README.md` | Added operating, testing, evaluation, AWS, architecture, and limitation documentation. |
| `docs/superpowers/sdd/task-6-report.md` | Added this evidence report. |
| `package.json` | Added `demo` and `eval:live` scripts; existing commands retained. |
| `playwright.config.ts` | Isolated fixture server, fixed loopback ports, no reuse/retries, desktop/mobile projects, artifacts. |
| `vitest.config.ts` | Explicit application/eval coverage inclusion, JSON summary, visible full file table, 80% thresholds. |
| `scripts/demo.ts` | Added offline Fastify/Vite launcher with safe API-base override and shutdown. |
| `scripts/eval.ts` | Replaced placeholder with offline runner and CLI exit status. |
| `scripts/eval-live.ts` | Added opt-in CLI parsing and safe scored results. |
| `src/agent/factory.ts` | Disabled retries/context recovery/native token-count calls; added request-local model-call guard. |
| `src/eval/fixtures.ts` | Added synthetic inquiry and positive/negative draft fixtures. |
| `src/eval/live.ts` | Added strict opt-in, hard cap, sequential generation/scoring, fail-fast runner. |
| `src/eval/scoring.ts` | Added deterministic scorer and explicit caveat. |
| `tests/agent-budget.test.ts` | Added real SDK loop tests with model I/O faked and transport config inspected. |
| `tests/eval.test.ts` | Added scorer mutations, control expectations, empty suite, and runner failure tests. |
| `tests/fixture-api.test.ts` | Added fixture HTTP contract, no-model-call, validation, and failure tests. |
| `tests/live-eval.test.ts` | Added opt-in/limit/CLI validation, fresh-agent counting, failure/no-retry, safe logging tests. |
| `tests/e2e/workflow.spec.ts` | Added three browser scenarios run on both device projects. |
| `tests/support/fixture-app.ts` | Added isolated fake-agent injection into the actual app/service/generator boundary. |

`package-lock.json`, prior tests, UI code/styles, API implementation, catalog, and shared schemas were not modified. Generated `coverage/`, `dist/`, `test-results/`, `playwright-report/`, and browser binaries inside `node_modules/` remain ignored. No runtime dependencies were added.

## TDD Evidence

1. Added evaluation, live-runner, and SDK-budget tests before implementation. Ran `npm test -- tests/eval.test.ts tests/live-eval.test.ts tests/agent-budget.test.ts`. Both new eval suites initially failed to import absent modules. More importantly, all three executable SDK-budget tests failed: transport retry/token-count options were missing, and both plain-text and invalid-structured-output paths made **two** model calls instead of one.
2. Added synthetic fixture data and minimal exported stubs so evaluation failures were assertions rather than missing imports. Ran `npm test -- tests/eval.test.ts tests/live-eval.test.ts`: **31 failed, 9 passed, 40 total**. Failures covered positive scoring, malformed/poor drafts, actionable fixture output, opt-in validation, capped runs, safe failure handling, and CLI success.
3. Implemented scoring, fixture/live runners, CLI parsing, and SDK guard. Ran `npm test -- tests/eval.test.ts tests/live-eval.test.ts tests/agent-budget.test.ts`: **43/43 passed**. `npm run typecheck` passed.
4. Added fixture-API tests with an unimplemented injected generator. Ran `npm test -- tests/fixture-api.test.ts tests/agent-budget.test.ts`: **1 failed, 7 passed, 8 total**. The intended success path received 502 instead of 201. The same run also confirmed expanded real-SDK success, throttling, and overflow tests passed using fake model I/O.
5. Implemented the isolated fixture app/demo and added browser acceptance tests. Full suite reached **83/83**. Browser setup initially failed before application assertions because the required binary was absent; installation and successful reruns are recorded below. No UI implementation changes were needed to satisfy browser tests.

The existing baseline tests were not rewritten to fit the implementation. New runtime behavior was introduced after failing tests; additional SDK characterization checks and browser acceptance tests verify preserved behavior as well.

## SDK Retry Inspection

Inspected installed SDK implementation and declaration files under `node_modules/@strands-agents/sdk/dist/src/`:

- `agent/agent.d.ts:153-170`: omitted retry strategy enables defaults; `null` disables it; structured output is separately configured.
- `agent/agent.js:293-332`: default retry plugin registration.
- `agent/agent.js:1135-1149`: plain-text output with a schema causes a second cycle with forced tool selection.
- `tools/structured-output-tool.js:44-64`: validation failure becomes a tool error suitable for repair.
- `agent/agent.js:1260-1273`: the loop exits on successful structured-output extraction; invalid output can continue.
- `agent/agent.js:1534-1634`: `BeforeModelCallEvent` precedes the model call on each attempt; model hooks can request retries.
- `hooks/registry.js:50-61`: ordinary hook exceptions propagate.
- `models/bedrock.d.ts:155-176` and `models/bedrock.js:155-174`: explicit native token-count opt-in and AWS client configuration forwarding.

Applied four complementary controls in `createWorkflowAgent`: `clientConfig.maxAttempts=1`, `retryStrategy=null`, `contextManager=false`, and `useNativeTokenCount=false`. A closure bound to each new agent counts `BeforeModelCallEvent`s and throws before a second model invocation. The counter is intentionally not reset on reused agents: application workflow generation creates a new agent for every request.

Tests exercise the real Strands loop with `BedrockModel.streamAggregated` replaced by a fake. Valid structured output completes in one call; plain text and invalid tool output cannot reach a second; throttling and context overflow propagate their original errors without retry/recovery. Model construction options are also captured while retaining the real model class. No AWS transport is used by these tests.

The live runner separately counts attempted workflows, permits at most **3 per run**, and stops on the first failed generation or score. Exceptions are consumed into safe diagnostics, not repaired. This is not an account-wide dollar budget and must be rechecked after SDK changes.

## Final Checks

Final implementation verification commands, all run from the project directory:

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0. |
| `npm test` | PASS, exit 0: **12 files, 83 tests passed, 0 failed**; final run 4.43 s. |
| `npm run test:coverage` | PASS, exit 0: **12 files, 83 tests passed**; final run 5.11 s; all four global 80% gates passed. |
| `npm run eval` | PASS, exit 0: **5/5 fixture expectations**. Scores: useful-discovery 100; useful-approval-handoff 100; malformed-output 0; empty-sections 25; repetition-and-no-questions 75. Negative scores are expected controls. |
| `npm run build` | PASS, exit 0: typecheck plus 112 Vite modules; JS 281.52 kB / gzip 85.07 kB, CSS 8.96 kB / gzip 2.61 kB, HTML 0.39 kB. UI build only. |
| `npm run test:e2e` with project-local browsers and sanitized environment below | PASS, exit 0: **6/6**, 0 retries/skips/failures, 10.0 s. Three desktop and three mobile Chromium cases. |
| `npm audit --audit-level=moderate` | PASS, exit 0: **0 vulnerabilities**. No audit fixes or dependency updates applied. |
| `npm run eval:live` | EXPECTED REFUSAL, exit 1: missing explicit opt-in/limit; no invocation. |
| `npm run eval:live -- --allow-live --limit=4` | EXPECTED REFUSAL, exit 1: over hard cap; no invocation. |
| `git diff --cached --stat` | Empty output, exit 0: staging area unchanged/empty. |

The tools' directory preflight verified the project directory before commands that generate artifacts. Build, coverage, and E2E commands were gated by that check.

### Coverage Details

Read back `coverage/coverage-summary.json` to verify new evaluation logic is measured, not silently absent:

| Scope | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| All included application/eval code | **89.32% (251/281)** | **85.94% (159/185)** | **92.42% (61/66)** | **89.65% (234/261)** |
| `src/eval/live.ts` | 100% | 100% | 100% | 100% |
| `src/eval/scoring.ts` | 100% | 94.73% | 100% | 100% |
| `src/eval/fixtures.ts` | 100% | 100% | 100% | 100% |
| `scripts/eval-live.ts` | 93.75% | 81.25% | 100% | 93.75% |
| `scripts/eval.ts` | 94.44% | 90.90% | 100% | 92.85% |

The two thin direct-execution CLI lines are not attributed to Vitest coverage; CLI refusal/exit behavior was additionally checked with actual child processes. Application `src/api/server.ts` and `src/ui/main.tsx` are included at 0%, not hidden. Re-export-only files have no executable statements. The operational demo launcher and test support are outside the production coverage inclusion patterns.

### Browser Setup and Isolation

Initial `npm run test:e2e` reported **6 launch failures**: missing `chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe` in the default user browser cache. No application assertions had run. This was not counted as a passing E2E run.

Installed browsers entirely in the project-local ignored tree with the exact command:

```bat
if exist "node_modules\playwright-core\" node -e "process.env.PLAYWRIGHT_BROWSERS_PATH='0';const r=require('node:child_process').spawnSync(process.execPath,['node_modules/@playwright/test/cli.js','install','chromium'],{stdio:'inherit'});process.exitCode=r.status??1;"
```

Installation exited 0, downloading Chrome for Testing **153.0.8010.12**, Chromium/headless revision **1243**, FFmpeg **1011**, and Winldd **1007** to `node_modules/playwright-core/.local-browsers`. Browser downloads and npm audit used network access; neither involved Bedrock.

The first post-install run with `PLAYWRIGHT_BROWSERS_PATH=0` passed **6/6 in 9.3 s**. Final adversarial environment run, exact command:

```bat
if exist "." node -e "const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('AWS_')&&!key.startsWith('BEDROCK_')));env.PLAYWRIGHT_BROWSERS_PATH='0';env.VITE_API_BASE_URL='http://127.0.0.1:1/must-not-be-used';const r=require('node:child_process').spawnSync('npm run test:e2e',{shell:true,stdio:'inherit',env});process.exitCode=r.status??1;"
```

This removes AWS/Bedrock environment configuration and deliberately sets a broken external API base. The suite still passes because the offline launcher explicitly pins the UI to its local fixture API. The credential provider chain is never invoked; no AWS credentials were read or supplied by the harness. Existing user credential files were not inspected or changed.

Playwright uses real HTTP through the Vite proxy, the original Fastify routes and workflow service, and generator output validation. Only the injected agent result is fake. The fixture-only error sentinel is confined to `tests/support/fixture-app.ts`; the production API does not import that file or inspect a fixture environment flag. Fresh server startup is required, with retries disabled. Final `.last-run.json` reads `{"status":"passed","failedTests":[]}`.

Both full-page screenshots were read and visually inspected. Desktop retains the two-column cockpit; mobile stacks intake/results with all fields readable. Assertions verified horizontal overflow was absent. Artifacts:

- `test-results/workflow-real-fixture-API--4cac3-ecklist-state-remains-local-chromium/workflow.png`
- `test-results/workflow-real-fixture-API--4cac3-ecklist-state-remains-local-mobile-chromium/workflow.png`
- `playwright-report/index.html`
- `coverage/index.html` and `coverage/coverage-summary.json`

After the final run, a `node:net` connection probe to `127.0.0.1:3001` and `:5174` returned **ECONNREFUSED for both**, confirming test servers were no longer listening.

### Nonzero Exit Proof

Executed a deliberately failing required-positive fixture without editing the shipped fixtures:

```bat
node --import tsx --input-type=module -e "import { runFixtureEvaluation } from './scripts/eval.ts';process.exitCode=runFixtureEvaluation([{id:'required-positive-failure-probe',draft:{},expectedFailures:[]}]);"
```

Output: `FAIL required-positive-failure-probe: 0/100`, an actionable `shape:` diagnostic, expected `none` versus observed `shape`, and `0/1 fixture expectations passed`.

A subsequent `spawnSync` verification ran this same probe, `node --import tsx scripts/eval-live.ts`, and `node --import tsx scripts/eval-live.ts --allow-live --limit=4`, checking each child status equals 1. All three printed **`Observed exit status: 1`**; the verification parent exited 0. The fake-agent tests separately verify option rejection happens before agent construction, and failed generation/poor scoring stop after one attempt with no retry. No valid live opt-in command was executed.

## Review and Remaining Concerns

Local code review checked all seven acceptance criteria, DI separation, option parsing before generation, score semantics, model-call guard ordering, SDK retry configuration forwarding, safe output, browser text rendering, coverage inclusion, and documentation against actual source. There was no independent subagent review tool available; this is not represented as independent review. No unresolved Task 6 correctness defect was identified in that review.

- **Live behavior intentionally unverified:** model access, IAM, provider latency/cost, and one-shot structured-output success rates require a separately authorized live run. Plain text or invalid output now fails safely rather than repairing with another call.
- **Heuristic limits:** checks are English-oriented lexical/structural signals, not truth, relevance, or hallucination detection. The two positive fixtures are narrow variants. The live runner repeats one synthetic inquiry and is a smoke check, not a representative model benchmark.
- **Browser limits:** Chromium desktop and emulated Pixel 5 only; no Firefox, WebKit, physical mobile device, or live-provider browser coverage. Browser binaries are local to `node_modules`; use `PLAYWRIGHT_BROWSERS_PATH=0` and reinstall after `npm ci`.
- **Existing deployment limits:** ordinary API binds all interfaces and lacks auth, TLS/security-header deployment, distributed rate limiting, a shared spend budget, concurrency limits, and an application-wide request deadline. Do not expose it publicly with credentials. The UI build does not bundle/serve the API. README documents these boundaries without expanding Task 6 into production infrastructure.
- **Demo limits:** fixed drafts do not react intelligently to arbitrary inquiries, the deliberate failure sentinel is test-only, and a maximum-length challenge plus fixture prefix can exceed the summary schema limit and safely fail.

## Self-Evaluation

Delivery is evidence-backed with all requested offline gates satisfied; the main limitations are explicit rather than hidden.

| Axis | Score | Evidence / improvement |
| --- | --- | --- |
| Accuracy | 4/5 | Fresh command results, SDK source inspection, and real-loop fake-model tests support the claims; live provider behavior remains unverified by design. |
| Completeness | 4/5 | All brief deliverables and checks are present; additional browser engines would broaden confidence beyond the required desktop/mobile coverage. |
| Clarity | 4/5 | README separates offline/demo/live operation and coverage semantics; the detailed report is necessarily longer than the final status. |
| Actionability | 4/5 | Runnable scripts and exact local browser setup are provided; project-local browser reinstall is an extra step after dependency reinstall. |
| Conciseness | 4/5 | Small scorer, runner, and DI harness without new runtime dependencies; documentation repeats key safety boundaries for standalone use. |

Overall **4.0/5**. Highest-value future improvements are an explicitly authorized provider smoke check, a more diverse human-reviewed synthetic fixture set, and broader browser coverage. None should be mistaken for completed work here. Self-check: the assessment is tied to reproducible artifacts and the user's stated prohibition on live calls, not unsupported quality claims.
