# Task 6: Evaluation and Delivery

## Goal

Complete the remaining task from `docs/superpowers/plans/2026-09-08-scopepilot-mvp.md`: deterministic draft scoring, fixture evaluations, opt-in capped live evaluations, Playwright fixture-mode E2E, README, MIT LICENSE, and final checks.

## Constraints

- Work only in the project directory and preserve existing Tasks 1-5 work.
- No commits, staging, publishing, deployment, or live Bedrock calls during implementation or verification.
- Use synthetic data only. No real email, CRM, payments, authentication, persistence, or multi-agent orchestration.
- Preserve one logical TypeScript Strands Agent and one Bedrock invocation per workflow, request-scoped agent instances, and Zod validation.
- Follow-up tasks remain display-only with local browser checkbox state; render user content as text.
- Use existing conventions and dependencies, small composable changes, and tests before new runtime behavior.

## Acceptance Criteria

- `npm run eval` runs synthetic fixtures offline, prints actionable deterministic scoring results, and fails with a nonzero exit code when required checks fail.
- Scoring validates draft shape and meaningful observable quality checks. Include positive and intentionally poor fixtures; make clear that deterministic heuristics do not prove factual grounding or model quality.
- Live evaluation is separate from default tests and evaluation, requires an explicit opt-in, and enforces a small hard invocation cap with no automatic retries. Validate options before invoking the agent. Test limits and failure behavior using injected fakes, not AWS.
- Playwright runs against deterministic fixtures without AWS credentials, exercises success and failure, all output sections, checklist behavior, and desktop/mobile layout. Prefer existing API dependency injection for an actual local API if feasible; otherwise document any browser route mocking limits clearly. Avoid environment flags that could accidentally enable fixture responses in the production API.
- Add an accurate README with setup, AWS environment configuration, offline checks/demo instructions, architecture, safety boundaries, evaluation limits, and known deployment limitations.
- Add a standard MIT LICENSE using a project contributor attribution rather than inventing a personal legal identity.
- Preserve existing tests and verify typecheck, unit/integration tests, coverage (target at least 80%), fixture eval, build, E2E, and dependency audit. Do not auto-apply broad dependency updates.

## Report

Write `docs/superpowers/sdd/task-6-report.md` with files changed, TDD evidence, exact commands/results, and remaining limitations. Return a concise status and any concerns. Repository has no commits yet, so normal Git diff cannot distinguish this task from prior untracked work; list your changed files explicitly.
