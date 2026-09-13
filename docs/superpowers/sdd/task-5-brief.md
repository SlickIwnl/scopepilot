# Task 5: React Consultant Cockpit

## Scope

Build the responsive ScopePilot web interface on top of the API. Do not modify any project outside the current repository. Do not commit changes.

## Product Behavior

- Load synthetic consultants from `GET /api/consultants`.
- Let the consultant choose a profile and enter client name, company, challenge, and desired outcome.
- Submit to `POST /api/workflows`.
- Show a clear loading state and a useful, generic error state.
- Render all three result sections: discovery brief, proposal, and follow-up tasks.
- Follow-up task checkboxes are local browser state only; no persistence route.
- Render all API/user content as normal React text. Never use `dangerouslySetInnerHTML`.
- Use semantic labels and keyboard-accessible controls.

## Visual Direction

Create a distinctive consultant cockpit rather than a generic dashboard: warm paper/ink foundation, strong editorial typography, one confident accent color, quiet ruled dividers, and a clear left-to-right flow from intake to handoff. Use restrained motion only for state feedback; keep it under 300ms, use transform/opacity, support `prefers-reduced-motion`, and include button press feedback. Avoid gradients, excessive rounded cards, and decorative UI that competes with the generated work.

## Requirements

- Implement the UI in `src/ui/` and keep API calls in a small `src/ui/api.ts` module.
- Add responsive CSS that stacks the intake and output panels on mobile.
- Add React Testing Library tests for consultant loading, form submission, loading state, API error, all three result sections, and local task completion.
- Preserve the existing Vite entrypoint and TypeScript strictness.

## Verification

Run the focused UI tests, all tests, `npm run typecheck`, and `npm run build`. Report exact commands and results.

## Report

Write a short report to `docs/superpowers/sdd/task-5-report.md` containing changed files, commands run, results, and concerns. Do not include secrets.
