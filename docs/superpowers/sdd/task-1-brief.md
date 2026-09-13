# Task 1: Bootstrap

## Scope

Create the initial ScopePilot TypeScript/React/Vite/Fastify project setup in the current repository. Do not modify any project outside the current working directory. Do not commit changes.

## Requirements

- Use ESM and strict TypeScript.
- Add package/config files, `.gitignore`, and `.env.example`.
- Install the current compatible packages for `@strands-agents/sdk`, `zod`, `fastify`, `@fastify/cors`, React, Vite, Vitest, React Testing Library, jsdom, Playwright, `tsx`, and required type packages.
- Add scripts for API, UI, typecheck, tests, coverage, evaluation placeholder, build, and E2E.
- Add a no-network SDK construction probe test that confirms Strands imports and model/agent construction work without making a Bedrock request.
- Use AWS credential resolution. Never write secrets into tracked files.
- The application must later remain within these constraints: one Strands Agent, synthetic data only, no auth/email/CRM/payments/persistence, and no modifications outside this repository.

## Verification

Run the bootstrap-focused test and typecheck. Report exact commands and results. If package names or Strands import paths differ from the requirement, resolve them against the installed package and document the working import.

## Report

Write a short report to `docs/superpowers/sdd/task-1-report.md` containing changed files, commands run, results, and concerns. Do not include secrets.
