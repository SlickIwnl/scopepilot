# Task 3: Structured Strands Agent

## Scope

Add the single request-scoped Strands Agent and prompt for ScopePilot. Do not modify any project outside the current repository. Do not commit changes.

## Requirements

- Add an agent factory and workflow generation function under `src/agent/`.
- Use the installed `@strands-agents/sdk` Bedrock model import verified by Task 1.
- Read `AWS_REGION` with a default of `us-east-1` and `BEDROCK_MODEL_ID` from environment configuration. Do not hardcode credentials or write secrets.
- Create a new Agent instance per request so mutable message history cannot leak between clients or collide under concurrent requests.
- Use one structured-output schema and one `invoke()` call for a workflow.
- The prompt must state: use only supplied consultant facts; label missing information as open questions; do not invent pricing, case studies, or commitments; do not send email, update a CRM, process payments, authenticate users, or delegate to another agent.
- Parse `result.structuredOutput` with `WorkflowDraftSchema` again before returning it.
- Expose dependency injection for deterministic tests. Unit tests must use a fake agent/result and must not call Bedrock.
- Map malformed structured output and agent errors to a safe application error type without exposing credentials or raw inquiry content.
- Add a fixture runner or other local fixture path if needed for later API/UI tests, but do not make live Bedrock the default.

## Verification

Add tests for a valid fake output, malformed output rejection, prompt safety constraints, and request-scoped agent construction. Run the focused agent tests, all existing tests, and `npm run typecheck`.

## Report

Write a short report to `docs/superpowers/sdd/task-3-report.md` containing changed files, commands run, results, and concerns. Do not include secrets.
