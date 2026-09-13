# Task 4: Fastify Workflow API

## Scope

Expose the ScopePilot workflow through a tested Fastify application. Do not modify any project outside the current repository. Do not commit changes.

## Requirements

- Implement `GET /api/health`.
- Implement `GET /api/consultants` using the synthetic catalog.
- Implement `POST /api/workflows` accepting `InquirySchema` and returning a generated `workflowId`, ISO `createdAt`, selected consultant, original validated inquiry, and validated draft.
- Validate the request body before agent invocation.
- Return `400` for invalid input, `404` for unknown consultant, and `502` for generation failure. Keep client errors generic and do not expose credentials, stack traces, or full inquiry content in logs/errors.
- Use dependency injection for catalog, clock, ID generation, and draft generation so tests never call Bedrock and can use deterministic values.
- Add a bounded body size, CORS configuration for the configured UI origin, and rate limiting for the expensive workflow route. Use a Fastify 5-compatible package or a small bounded in-memory implementation if the package is not compatible.
- Preserve the existing SDK probe, contracts, catalog, and agent behavior.

## Verification

Write tests with `app.inject()` for health, catalog listing, successful workflow, invalid body, unknown consultant, generation failure, body-size handling, and rate limiting. Run the focused API tests, all tests, typecheck, and build.

## Report

Write a short report to `docs/superpowers/sdd/task-4-report.md` containing changed files, commands run, results, and concerns. Do not include secrets.
