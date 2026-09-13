import { WorkflowDraftSchema } from "../shared/contracts";

export const EVALUATION_CAVEAT =
  "Deterministic heuristics do not prove factual grounding or model quality. Human review is required.";

export interface DraftScore {
  readonly passed: boolean;
  readonly score: number;
  readonly failures: readonly string[];
}

export function scoreDraft(draft: unknown): DraftScore {
  const parsed = WorkflowDraftSchema.safeParse(draft);
  if (!parsed.success) {
    return {
      passed: false,
      score: 0,
      failures: ["shape: Return all fields with the types and bounds in WorkflowDraftSchema."],
    };
  }

  const { discoveryBrief: brief, proposal, followUpTasks: tasks } = parsed.data;
  const words = (text: string, minimum: number) =>
    (text.match(/\b[a-z0-9]+(?:[-'][a-z0-9]+)*\b/gi)?.length ?? 0) >= minimum;
  const populated = (items: readonly string[]) =>
    items.length > 0 && items.every((item) => words(item, 3));
  const lists = [
    brief.goals,
    brief.constraints,
    brief.openQuestions,
    proposal.deliverables,
    tasks.map((task) => task.title),
  ];
  const checks: readonly [boolean, string][] = [
    [words(brief.summary, 6) && words(proposal.title, 3) && words(proposal.summary, 6) && words(proposal.scope, 6) && words(proposal.timeline, 4),
      "substance: Use at least 6 words in summaries and scope, 3 in the title, and 4 in the timeline."],
    [populated(brief.goals), "goals: Include at least one goal; use at least 3 words per item."],
    [populated(brief.constraints), "constraints: State constraints or explicitly identify unknowns; use at least 3 words per item."],
    [brief.openQuestions.length > 0 && brief.openQuestions.every((question) => words(question, 4) && question.endsWith("?")),
      "questions: Include unresolved questions with at least 4 words and a question mark."],
    [populated(proposal.deliverables), "deliverables: Name at least one reviewable output; use at least 3 words per item."],
    [tasks.length > 0 && tasks.every((task) => words(task.title, 3) && words(task.rationale, 6)),
      "tasks: Include follow-up tasks with at least 3 words in each title and 6 in each rationale."],
    [lists.every((items) => new Set(items.map((item) => item.toLowerCase().replace(/\s+/g, " ").trim())).size === items.length),
      "distinct: Remove repeated list items and task titles (ignoring case and whitespace)."],
  ];
  const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
  return {
    passed: failures.length === 0,
    score: Math.round(100 * (8 - failures.length) / 8),
    failures,
  };
}
