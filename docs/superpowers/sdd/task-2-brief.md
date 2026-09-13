# Task 2: Contracts and Synthetic Catalog

## Scope

Add shared Zod contracts and the synthetic consultant catalog to the current ScopePilot repository. Do not modify any project outside the current working directory. Do not commit changes.

## Requirements

- Add `src/shared/contracts.ts` with strict Zod schemas for inquiries, consultant profiles, workflow drafts, and follow-up tasks.
- Inquiry fields: `consultantId`, `clientName`, `company`, `challenge`, and `desiredOutcome`. Trim text, enforce meaningful minimum lengths, and bound maximum lengths.
- Workflow draft sections: discovery brief (`summary`, `goals`, `constraints`, `openQuestions`), proposal (`title`, `summary`, `scope`, `deliverables`, `timeline`), and follow-up tasks (`title`, `owner` enum `consultant|client`, `dueInDays`, `rationale`). Bound arrays and strings.
- Add synthetic consultant data with `id`, `displayName`, `track: professional-agents`, `role: independent-consultant`, specialties, services, and proof points. No real people or client data.
- Add a typed catalog loader. Unknown consultant IDs return `undefined`, not an exception.
- Add tests first/alongside implementation for valid inquiry parsing, short-input rejection, consultant track/role validation, malformed workflow-draft rejection, and unknown consultant lookup.
- Keep the contract API usable by later agent and Fastify tasks.

## Verification

Run the focused contract/catalog tests and `npm run typecheck`. Report exact commands and results.

## Report

Write a short report to `docs/superpowers/sdd/task-2-report.md` containing changed files, commands run, results, and concerns. Do not include secrets.
