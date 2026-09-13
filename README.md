# ScopePilot

A synthetic consultant cockpit: turn a client inquiry into a discovery brief, proposal draft, and local follow-up checklist. Built with TypeScript, React/Vite, Fastify, Zod, and one request-scoped Strands Agent using Amazon Bedrock.

This is a hackathon MVP, not a production service. Use synthetic data only. Drafts need human review and are not sent anywhere automatically.

## Setup

Use a recent Node.js release supported by the installed dependencies and npm. Task 6 was verified on Windows with Node **26.3.1** and npm **11.17.0**. Install the lockfile dependencies:

```sh
npm ci
```

### Offline Demo

```sh
npm run demo
```

Open **http://127.0.0.1:5174**. This command starts a loopback-only Vite UI and a real Fastify API on port **3001**, with an injected fake agent. No AWS credentials or Bedrock access are needed. Do not run the regular API/UI commands at the same ports.

Try these synthetic inputs:

| Field | Example |
| --- | --- |
| Consultant | Cedar Finch |
| Client name | Taylor Example |
| Company | Northstar Demo Studio |
| Challenge | Incoming client requests lack clear scope and create repeated discovery work. |
| Desired outcome | A repeatable discovery process with a bounded proposal and clear next steps. |

Use company **`FAIL_GENERATION`** to exercise a safe generation error. Other valid inputs receive a fixed demonstration draft, with the challenge echoed as text in its summary; this is not model reasoning. Extremely long challenge text can exceed the fixture summary's schema bound and produce a safe error. Checkboxes only update component memory, reset on the next submission or reload, and never trigger an API call.

The demo uses `tests/support/fixture-app.ts` and the production `buildApp()` dependency injection. There is **no fixture environment flag in the production API**. The demo overrides `VITE_API_BASE_URL` to a local proxy even if `.env` files or the parent shell specify a live API. It permits 100 workflow requests/minute for repeated browser tests; the ordinary API defaults to 10.

## Offline Checks

```sh
npm run typecheck
npm test
npm run test:coverage
npm run eval
npm run build
npm run test:e2e
npm audit --audit-level=moderate
```

Install Playwright's Chromium before the E2E command. The project can keep browsers inside ignored `node_modules`, rather than the user-wide cache. Keep `PLAYWRIGHT_BROWSERS_PATH=0` set for **both installation and testing**:

```bat
rem Windows cmd.exe
set "PLAYWRIGHT_BROWSERS_PATH=0"
npx playwright install chromium
npm run test:e2e
```

```sh
# macOS/Linux shell (install OS libraries separately if Playwright requests them)
export PLAYWRIGHT_BROWSERS_PATH=0
npx playwright install chromium
npm run test:e2e
```

Alternatively, omit that variable for both commands to use Playwright's standard user cache. Reinstall local browsers after `npm ci`, which recreates `node_modules`. Stop any existing demo before running E2E; the suite deliberately refuses to reuse a server so it cannot accidentally test a live API.

The browser suite runs the actual UI, Vite proxy, Fastify routes, workflow service, and Zod validation. Only agent output is faked at the existing injection boundary; no browser API responses are mocked. It covers all output fields, safe errors and recovery, checklist locality/reset, HTML-as-text, and desktop/mobile layout in Chromium (mobile is emulation, not a physical phone). It does not test Bedrock or other browser engines. Screenshots and failures go to `test-results/`; the HTML report is `playwright-report/index.html`.

Coverage includes all `src` TypeScript/TSX and **both eval CLI modules**, including otherwise unexecuted application entry points. Global minimums of 80% for statements, branches, functions, and lines are enforced. `coverage/coverage-summary.json` exposes per-file results; the demo launcher and test support are not included in the production coverage denominator.

## Deterministic Evaluation

`npm run eval` is entirely offline. Five synthetic fixtures include two useful drafts and three intentional negative controls. Exit code 0 means every fixture matched its **exact expected failed-check set**, not that poor fixtures were accepted as good. Missing positive checks, unexpected negative results, and empty suites fail with exit code 1.

`src/eval/scoring.ts` first validates `WorkflowDraftSchema`. Invalid shapes score 0. Valid shapes get one of eight equally weighted checks; the other seven are:

- Minimum text substance: summaries/scope have 6 words, title 3, timeline 4.
- Nonempty goals with at least 3 words per item.
- Nonempty constraints with at least 3 words per item.
- Open questions with at least 4 words each and a trailing question mark.
- Nonempty deliverables with at least 3 words per item.
- Nonempty tasks with 3-word titles and 6-word rationales; schema validation enforces owners and due-day bounds.
- Distinct items within each list and distinct task titles, ignoring case and whitespace.

All checks are required to pass; rounded scores summarize failures and the output gives remediation hints. These English-oriented, deterministic heuristics **do not prove factual grounding, pricing accuracy, safety, relevance, feasibility, or model quality**. Repeated filler can pass word-count checks; plausible hallucinations can score 100. Review generated drafts against the supplied inquiry and consultant facts. Offline fixtures test the checker and plumbing, not an LLM.

## AWS Configuration

Only the ordinary API and explicitly opted-in live eval can invoke Bedrock. The API uses the AWS SDK's standard credential provider chain (for example a local AWS profile or an IAM role). Never put credentials in source, browser variables, logs, or committed files.

| Variable | Behavior |
| --- | --- |
| `BEDROCK_MODEL_ID` | Required for generation. Choose an accessible Converse/tool-use-capable model or inference profile in your account/region. |
| `AWS_REGION` | Defaults to `us-east-1`. |
| `AWS_PROFILE` | Optional standard AWS SDK profile selection. |
| `PORT` | Ordinary API port, defaults to `3000`. |
| `UI_ORIGIN` | Ordinary API's allowed CORS origin, defaults to `http://localhost:5173`. Must match exactly if making cross-origin requests. |
| `VITE_API_BASE_URL` | Optional browser-visible API base. Leave unset/empty to use `/api` and Vite's development proxy to port 3000. Never place secrets here. |

`.env.example` is a reference, **not automatically loaded by `npm run api` or the live eval**. Vite loads its own `.env` files; the Node entry points require exported shell environment variables (or an explicitly configured environment loader). The example model ID is not a guarantee of account availability or one-shot structured-output compatibility. Configure least-privilege Bedrock invocation permissions for the selected model/inference profile; streaming invocation may require `bedrock:InvokeModelWithResponseStream`.

For a live API session, configure AWS outside the browser, then run these in separate terminals:

```sh
npm run api
npm run ui -- --host 127.0.0.1
```

Use the printed UI address. If using the example's direct API base at `127.0.0.1:3000`, set `UI_ORIGIN=http://127.0.0.1:5173`, or leave `VITE_API_BASE_URL` empty to use the proxy. A workflow submission is a potentially billable model request. Health and catalog requests do not call the model.

### Opt-In Live Evaluation

This command is **not** part of tests, build, or offline eval. Run it only when intentionally spending AWS resources:

```sh
npm run eval:live -- --allow-live --limit=1
```

Both flags are required. `--limit` must be an integer from **1 to 3**; unknown, duplicate, missing, or out-of-range options are rejected before agent construction. No environment variable silently opts in. The runner repeats the same synthetic inquiry with fresh agents, sequentially, to provide a tiny smoke/consistency check, not a representative benchmark. It stops at the first generation or scoring failure, returns nonzero, and prints only scores and safe diagnostics, not raw provider errors or generated drafts.

The hard cap is **3 workflow attempts per run**, not an account-wide quota or dollar budget. Re-running the command creates a new budget. AWS credential resolution may have its own network activity. All implementation tests use injected fakes; no live Bedrock run is claimed.

## Architecture

```text
React inquiry form
  -> POST /api/workflows
  -> Fastify validates InquirySchema and selects the synthetic consultant
  -> workflow service creates request-scoped generation
  -> one Strands Agent / one permitted Bedrock model call
  -> Strands structured-output tool + WorkflowDraftSchema validation
  -> workflow envelope -> browser Zod validation -> text-only React output
```

- `src/shared/contracts.ts`: strict bounded Zod request, catalog, draft, and response contracts.
- `src/catalog/`: one synthetic consultant profile; currently TypeScript data, not an external database.
- `src/agent/`: supplied-data prompt, safe errors, request-local agents, no external-action tools.
- `src/api/`: dependency-injected Fastify app and workflow service; metadata envelope with ID/time, no persistence.
- `src/ui/`: responsive form, loading/error/results states, local checklist state.
- `src/eval/` and `scripts/eval*.ts`: fixtures, deterministic scorer, and separate capped live smoke runner.
- `scripts/demo.ts` and `tests/support/`: loopback-only offline harness; not a production API mode.

The installed Strands SDK has implicit retries and structured-output repair cycles. `factory.ts` disables AWS transport retries (`maxAttempts: 1`), Strands retries (`retryStrategy: null`), context management/recovery (`contextManager: false`), and native token-count requests. A request-local `BeforeModelCallEvent` hook rejects any second model call, including implicit structured-output repair. Plain text, malformed output, throttling, and context overflow fail rather than invoke again. The happy path still uses the SDK's structured-output tool, not a second agent. Fake-model tests exercise the real SDK loop. Recheck this boundary when upgrading the SDK.

## API and Safety

| Route | Result |
| --- | --- |
| `GET /api/health` | `200 {"status":"ok"}`; not a Bedrock readiness probe. |
| `GET /api/consultants` | `200` synthetic catalog. |
| `POST /api/workflows` | `201` workflow; `400` invalid input; `404` unknown consultant; `413` oversized body; `429` rate limited; `502` generation failed. |

Inputs are trimmed and bounded. Requests default to a 16 KiB body limit. Workflow POSTs have a per-process/per-IP in-memory limit of 10/minute, capped at 1,000 client buckets. CORS allows one configured origin. Application logging is disabled; raw inquiries and provider errors are not intentionally logged. UI content is rendered as text, never raw HTML.

No real email, CRM, payments, authentication, storage, task execution, delegation, or multi-agent orchestration is implemented. Prompt instructions discourage invented facts and external actions; they are not proof against prompt injection. There are no side-effect tools for the model to call.

## Deployment Limits

Do not expose the credential-enabled API publicly as-is. It binds `0.0.0.0` and has no authentication, TLS termination, durable/distributed rate limiting, account-wide spending budget, concurrency control, or application-level end-to-end deadline. CORS is not authorization. In-memory client limits can be reset by restart or bypassed across processes/IPs, and oldest buckets can be evicted. Provider behavior and model support have not been verified live.

`npm run build` typechecks and produces **only the static UI** in `dist/`; it does not bundle the Node API. A deployment needs a separately operated API, same-origin `/api` reverse proxy or build-time `VITE_API_BASE_URL`, correct CORS, secrets management, HTTPS/security headers, access control, request deadlines, and durable cost/rate controls. Vite's dev proxy does not exist in the static build. Neither the demo server nor Vite's development server is a production deployment.

## License

MIT, copyright 2026 ScopePilot contributors. See [LICENSE](LICENSE). Verification evidence and remaining limits are in [the Task 6 report](docs/superpowers/sdd/task-6-report.md).
