import { buildApp } from "../../src/api/app";
import { generateWorkflowDraft } from "../../src/agent";
import { goodDraft } from "../../src/eval/fixtures";

export function buildFixtureApp() {
  return buildApp({
    uiOrigin: "http://127.0.0.1:5174",
    clock: () => new Date("2026-09-08T12:00:00.000Z"),
    idGenerator: () => "fixture-workflow",
    rateLimit: { maxRequests: 100 },
    draftGenerator: (inquiry, consultant) => generateWorkflowDraft(inquiry, consultant, {
      agentFactory: () => ({
        invoke: async () => {
          if (inquiry.company === "FAIL_GENERATION") throw new Error("fixture failure detail");
          return {
            structuredOutput: {
              ...goodDraft,
              discoveryBrief: { ...goodDraft.discoveryBrief, summary: `${goodDraft.discoveryBrief.summary} Inquiry: ${inquiry.challenge}` },
            },
          };
        },
      }),
    }),
  });
}
