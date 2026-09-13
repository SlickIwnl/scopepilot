# ScopePilot MVP Plan

## Goal

Build a public hackathon project named ScopePilot for independent consultants. One client inquiry becomes a validated discovery brief, proposal draft, and follow-up task list.

## Global Constraints

- Work only in the project directory.
- Never copy or modify `fantasy-stocks` or `fantasy-stocks-public`.
- Use one logical TypeScript Strands Agent and one Bedrock invocation per workflow.
- Use Zod for request, catalog, and structured output validation.
- Use synthetic data only.
- No real email, CRM, payments, authentication, persistence, or multi-agent orchestration.
- Follow-up tasks are display-only with local browser checkbox state.
- Bedrock uses AWS credential resolution and environment variables; never commit secrets.
- Keep all user content rendered as text, not raw HTML.

## Approved Architecture

- TypeScript, ESM, strict mode.
- Fastify API with `GET /api/health`, `GET /api/consultants`, and `POST /api/workflows`.
- React and Vite responsive UI.
- Vitest unit and integration tests, React Testing Library, and Playwright E2E.
- Synthetic consultant catalog in JSON.
- Request-scoped Strands Agent instances to prevent mutable history leaking between requests.

## Data Contracts

`InquirySchema` fields: `consultantId`, `clientName`, `company`, `challenge`, and `desiredOutcome`. Trim strings, require meaningful minimum lengths, and bound maximum lengths.

`WorkflowDraftSchema` contains `discoveryBrief`, `proposal`, and `followUpTasks`. The brief has summary, goals, constraints, and open questions. The proposal has title, summary, scope, deliverables, and timeline. Tasks have title, owner (`consultant` or `client`), `dueInDays`, and rationale.

## Tasks

### Task 1: Bootstrap

Create package/config files, install the current compatible TypeScript Strands SDK, Fastify, React, Vite, Zod, Vitest, testing utilities, and Playwright. Add strict TypeScript, ESM, scripts, `.gitignore`, `.env.example`, and a no-network SDK construction probe.

### Task 2: Contracts and Catalog

Add Zod contracts, synthetic consultant data, catalog loading, and tests for valid and invalid inquiries, consultant validation, and malformed drafts.

### Task 3: Agent

Add the single structured-output agent and prompt. Use only supplied consultant facts, label unknowns as open questions, never invent pricing or case studies, and explicitly prohibit external side effects. Inject a fake result in unit tests; do not call Bedrock in deterministic tests.

### Task 4: API

Implement dependency-injected workflow service and Fastify app. Validate input before agent invocation, return 400 for invalid body, 404 for unknown consultant, and 502 for generation failure. Add bounded body size, CORS, rate limiting, safe errors, and metadata-only logging.

### Task 5: UI

Build a responsive consultant cockpit with form and consultant selector on the left, and discovery brief, proposal, and follow-up checklist on the right. Cover loading, errors, success, and local task completion state with tests.

### Task 6: Evaluation and Delivery

Add deterministic draft scoring, fixture evaluations, opt-in capped live evaluations, Playwright fixture-mode E2E, README, MIT LICENSE, and final typecheck/test/coverage/build/audit checks. Keep live Bedrock evaluation separate from default tests.

## Verification Commands

```text
npm run typecheck
npm test
npm run test:coverage
npm run eval
npm run build
npm run test:e2e
npm audit --audit-level=moderate
```
