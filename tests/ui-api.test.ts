import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConsultantProfile, Inquiry } from "../src/shared/contracts";
import { createWorkflow, getConsultants, type WorkflowResult } from "../src/ui/api";

const consultant: ConsultantProfile = {
  id: "cedar-finch",
  displayName: "Cedar Finch",
  track: "professional-agents",
  role: "independent-consultant",
  specialties: ["service design"],
  services: ["discovery facilitation"],
  proofPoints: ["Synthetic demonstration profile."],
};

const inquiry: Inquiry = {
  consultantId: consultant.id,
  clientName: "Taylor Client",
  company: "Acme Demo Co.",
  challenge: "The team needs a clearer way to scope incoming work.",
  desiredOutcome: "A repeatable discovery and proposal workflow.",
};

const workflow: WorkflowResult = {
  workflowId: "workflow-ui-api-001",
  createdAt: "2026-09-08T12:00:00.000Z",
  consultant,
  inquiry,
  draft: {
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
  },
};

describe("ScopePilot UI API client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("loads consultants from the catalog endpoint", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ consultants: [consultant] }), { status: 200 }),
    );

    await expect(getConsultants()).resolves.toEqual([consultant]);
    expect(fetchMock).toHaveBeenCalledWith("/api/consultants", undefined);
  });

  it("posts the inquiry to the workflow endpoint", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(workflow), { status: 201 }));

    await expect(createWorkflow(inquiry)).resolves.toEqual(workflow);
    expect(fetchMock).toHaveBeenCalledWith("/api/workflows", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(inquiry),
    });
  });

  it("hides endpoint details behind a generic request error", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "private backend detail" }), { status: 502 }),
    );

    await expect(getConsultants()).rejects.toThrow("ScopePilot request failed.");
  });

  it("rejects a malformed consultant response at the UI boundary", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ consultants: [{ id: "incomplete" }] }), { status: 200 }),
    );

    await expect(getConsultants()).rejects.toThrow("ScopePilot response was invalid.");
  });

  it("rejects a malformed workflow response at the UI boundary", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ workflowId: workflow.workflowId }), { status: 201 }),
    );

    await expect(createWorkflow(inquiry)).rejects.toThrow("ScopePilot response was invalid.");
  });
});
