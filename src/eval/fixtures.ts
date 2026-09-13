import type { Inquiry, WorkflowDraft } from "../shared/contracts";

export const syntheticInquiry: Inquiry = {
  consultantId: "cedar-finch",
  clientName: "Taylor Example",
  company: "Northstar Demo Studio",
  challenge: "Incoming client requests lack clear scope and create repeated discovery work.",
  desiredOutcome: "A repeatable discovery process with a bounded proposal and clear next steps.",
};

export const goodDraft: WorkflowDraft = {
  discoveryBrief: {
    summary: "Northstar Demo Studio needs a repeatable way to clarify incoming client requests.",
    goals: ["Reduce repeated discovery work with a shared intake process."],
    constraints: ["Budget and delivery date are unknown and require confirmation."],
    openQuestions: ["Who approves the scope?", "What is the target delivery date?"],
  },
  proposal: {
    title: "Client discovery workflow design",
    summary: "Use discovery facilitation and scope definition to shape a repeatable client intake process.",
    scope: "Map the current intake process and define a bounded discovery workflow for review.",
    deliverables: ["Discovery workshop agenda", "Client intake template", "Draft scope document"],
    timeline: "Confirm a delivery schedule after the discovery session.",
  },
  followUpTasks: [
    { title: "Confirm the scope approver", owner: "client", dueInDays: 1, rationale: "Scope approval ownership is not supplied in the inquiry." },
    { title: "Prepare a discovery agenda", owner: "consultant", dueInDays: 0, rationale: "A focused session will clarify the current intake process." },
    { title: "Confirm the delivery date", owner: "client", dueInDays: 3, rationale: "The proposal timeline needs the client's target delivery date." },
  ],
};

export interface DraftFixture {
  readonly id: string;
  readonly draft: unknown;
  readonly expectedFailures: readonly string[];
}

export const workflowFixtures: readonly DraftFixture[] = [
  { id: "useful-discovery", draft: goodDraft, expectedFailures: [] },
  {
    id: "useful-approval-handoff",
    draft: { ...goodDraft, proposal: { ...goodDraft.proposal, title: "Scope approval handoff design" } },
    expectedFailures: [],
  },
  { id: "malformed-output", draft: { proposal: "not a draft" }, expectedFailures: ["shape"] },
  {
    id: "empty-sections",
    draft: {
      ...goodDraft,
      discoveryBrief: { summary: "TBD", goals: [], constraints: [], openQuestions: [] },
      proposal: { title: "TBD", summary: "TBD", scope: "TBD", deliverables: [], timeline: "TBD" },
      followUpTasks: [],
    },
    expectedFailures: ["substance", "goals", "constraints", "questions", "deliverables", "tasks"],
  },
  {
    id: "repetition-and-no-questions",
    draft: {
      ...goodDraft,
      discoveryBrief: { ...goodDraft.discoveryBrief, openQuestions: ["Everything is already decided."] },
      followUpTasks: [goodDraft.followUpTasks[0], goodDraft.followUpTasks[0]],
    },
    expectedFailures: ["questions", "distinct"],
  },
];
