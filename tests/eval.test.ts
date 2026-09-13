// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { scoreDraft } from "../src/eval/scoring";
import { goodDraft, workflowFixtures } from "../src/eval/fixtures";
import { runFixtureEvaluation } from "../scripts/eval";

describe("deterministic draft scoring", () => {
  it("accepts the synthetic useful draft deterministically", () => {
    const score = scoreDraft(goodDraft);
    expect(score).toEqual(scoreDraft(JSON.parse(JSON.stringify(goodDraft))));
    expect(score).toMatchObject({ passed: true, score: 100, failures: [] });
  });

  it.each([null, {}, { ...goodDraft, extra: "not permitted" }])(
    "rejects malformed drafts without throwing: %j",
    (draft) => {
      expect(scoreDraft(draft)).toMatchObject({ passed: false, score: 0 });
      expect(scoreDraft(draft).failures[0]).toContain("shape:");
    },
  );

  it.each([
    ["substance", (draft: typeof goodDraft) => { draft.proposal.scope = "TBD"; }],
    ["goals", (draft: typeof goodDraft) => { draft.discoveryBrief.goals = []; }],
    ["constraints", (draft: typeof goodDraft) => { draft.discoveryBrief.constraints = ["TBD"]; }],
    ["questions", (draft: typeof goodDraft) => { draft.discoveryBrief.openQuestions = ["No questions remain."]; }],
    ["deliverables", (draft: typeof goodDraft) => { draft.proposal.deliverables = []; }],
    ["tasks", (draft: typeof goodDraft) => { draft.followUpTasks = []; }],
    ["tasks", (draft: typeof goodDraft) => { draft.followUpTasks[0].rationale = "TBD"; }],
    ["distinct", (draft: typeof goodDraft) => { draft.proposal.deliverables.push(` ${draft.proposal.deliverables[0].toUpperCase()} `); }],
    ["distinct", (draft: typeof goodDraft) => { draft.followUpTasks.push({ ...draft.followUpTasks[0] }); }],
  ] as const)("flags the observable %s defect", (check, damage) => {
    const draft = structuredClone(goodDraft);
    damage(draft);
    const score = scoreDraft(draft);
    expect(score.passed).toBe(false);
    expect(score.score).toBeLessThan(100);
    expect(score.failures.some((failure) => failure.startsWith(`${check}:`))).toBe(true);
  });
});

describe("offline fixture evaluation", () => {
  it("checks both positive and intentional negative controls with actionable output", () => {
    const write = vi.fn();
    expect(runFixtureEvaluation(workflowFixtures, write)).toBe(0);
    expect(workflowFixtures.some((fixture) => fixture.expectedFailures.length === 0)).toBe(true);
    expect(workflowFixtures.some((fixture) => fixture.expectedFailures.length > 0)).toBe(true);
    const output = write.mock.calls.flat().join("\n");
    expect(output).toContain("shape:");
    expect(output).toContain("questions:");
    expect(output).toContain("do not prove factual grounding or model quality");
  });

  it("fails if a required positive check fails or a negative control passes", () => {
    const write = vi.fn();
    expect(runFixtureEvaluation([
      { id: "broken-positive", draft: {}, expectedFailures: [] },
      { id: "broken-negative", draft: goodDraft, expectedFailures: ["tasks"] },
    ], write)).toBe(1);
    expect(write.mock.calls.flat().join("\n")).toContain("FAIL broken-positive");
  });

  it("fails an empty suite rather than silently passing", () => {
    expect(runFixtureEvaluation([], vi.fn())).toBe(1);
  });
});
