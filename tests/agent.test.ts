import { describe, expect, it } from "vitest";
import {
  createWorkflowAgent,
  generateWorkflowDraft,
  WorkflowGenerationError,
} from "../src/agent";
import type { ConsultantProfile, Inquiry, WorkflowDraft } from "../src/shared/contracts";

const inquiry: Inquiry = {
  consultantId: "cedar-finch",
  clientName: "Taylor Client",
  company: "Acme Demo Co.",
  challenge: "The team needs a clearer way to scope incoming work.",
  desiredOutcome: "A repeatable discovery and proposal workflow.",
};

const consultant: ConsultantProfile = {
  id: "cedar-finch",
  displayName: "Cedar Finch",
  track: "professional-agents",
  role: "independent-consultant",
  specialties: ["service design", "workflow strategy"],
  services: ["discovery facilitation", "scope definition"],
  proofPoints: ["Synthetic demonstration profile."],
};

const validDraft: WorkflowDraft = {
  discoveryBrief: {
    summary: "A repeatable discovery and proposal workflow is needed.",
    goals: ["Clarify incoming work."],
    constraints: ["Use the supplied consultant profile."],
    openQuestions: ["What is the target delivery date?"],
  },
  proposal: {
    title: "Scope discovery workflow",
    summary: "A bounded engagement to clarify and package the client request.",
    scope: "Facilitate discovery and define the initial engagement scope.",
    deliverables: ["Discovery brief", "Proposal draft"],
    timeline: "Confirm after the discovery session.",
  },
  followUpTasks: [
    {
      title: "Confirm the target delivery date",
      owner: "client",
      dueInDays: 3,
      rationale: "The inquiry does not provide a target date.",
    },
  ],
};

describe("ScopePilot workflow agent", () => {
  it("returns a valid fake structured result after one invocation", async () => {
    const prompts: string[] = [];

    const result = await generateWorkflowDraft(inquiry, consultant, {
      agentFactory: () => ({
        invoke: async (prompt: string) => {
          prompts.push(prompt);
          return { structuredOutput: validDraft };
        },
      }),
    });

    expect(result).toEqual(validDraft);
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toContain(consultant.displayName);
  });

  it("rejects malformed structured output with a safe application error", async () => {
    let thrown: unknown;

    try {
      await generateWorkflowDraft(inquiry, consultant, {
        agentFactory: () => ({
          invoke: async () => ({
            structuredOutput: {
              discoveryBrief: {},
              proposal: {},
              followUpTasks: [],
            },
          }),
        }),
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(WorkflowGenerationError);
    expect(thrown).toMatchObject({
      code: "invalid-output",
      message: "Workflow generation returned invalid structured output.",
    });
    expect((thrown as Error).message).not.toContain(inquiry.company);
  });

  it("maps agent failures without exposing raw error or inquiry content", async () => {
    const secret = "raw-inquiry-secret";
    const sensitiveInquiry = { ...inquiry, company: secret };
    let thrown: unknown;

    try {
      await generateWorkflowDraft(sensitiveInquiry, consultant, {
        agentFactory: () => ({
          invoke: async () => {
            throw new Error(`Bedrock credentials and ${secret} failed`);
          },
        }),
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(WorkflowGenerationError);
    expect(thrown).toMatchObject({
      code: "agent-failure",
      message: "Workflow generation failed.",
    });
    expect((thrown as Error).message).not.toContain(secret);
    expect((thrown as Error).message).not.toContain("credentials");
  });

  it("includes the required safety constraints in the generation prompt", async () => {
    let prompt = "";

    await generateWorkflowDraft(inquiry, consultant, {
      agentFactory: () => ({
        invoke: async (value: string) => {
          prompt = value;
          return { structuredOutput: validDraft };
        },
      }),
    });

    expect(prompt).toContain("Use only supplied consultant facts");
    expect(prompt).toContain("Label missing information as open questions");
    expect(prompt).toContain("Do not invent pricing, case studies, or commitments");
    expect(prompt).toContain(
      "Do not send email, update a CRM, process payments, authenticate users, or delegate to another agent",
    );
  });

  it("constructs a new injected agent for each request", async () => {
    const agents: Array<{ invoke: (prompt: string) => Promise<unknown> }> = [];
    const agentFactory = () => {
      const agent = {
        invoke: async () => ({ structuredOutput: validDraft }),
      };
      agents.push(agent);
      return agent;
    };

    await Promise.all([
      generateWorkflowDraft(inquiry, consultant, { agentFactory }),
      generateWorkflowDraft(
        { ...inquiry, company: "Another Demo Co." },
        consultant,
        { agentFactory },
      ),
    ]);

    expect(agents).toHaveLength(2);
    expect(agents[0]).not.toBe(agents[1]);
  });

  it("configures each Bedrock agent from environment values without invoking it", () => {
    const first = createWorkflowAgent({
      AWS_REGION: "eu-west-1",
      BEDROCK_MODEL_ID: "test.model.one",
    });
    const second = createWorkflowAgent({
      AWS_REGION: "eu-west-1",
      BEDROCK_MODEL_ID: "test.model.one",
    });

    expect(first).not.toBe(second);
    expect(first.messages).not.toBe(second.messages);
    expect(first.model).not.toBe(second.model);
    expect(first.model.getConfig()).toMatchObject({ modelId: "test.model.one" });
    expect(first.systemPrompt).toContain("Use only supplied consultant facts");
  });
});
