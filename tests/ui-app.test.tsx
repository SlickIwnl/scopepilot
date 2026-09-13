import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ConsultantProfile,
} from "../src/shared/contracts";
import type { WorkflowResult } from "../src/ui/api";
import { App } from "../src/ui/App";

const mocks = vi.hoisted(() => ({
  getConsultants: vi.fn(),
  createWorkflow: vi.fn(),
}));

vi.mock("../src/ui/api", () => mocks);

const consultant: ConsultantProfile = {
  id: "cedar-finch",
  displayName: "Cedar Finch",
  track: "professional-agents",
  role: "independent-consultant",
  specialties: ["service design", "workflow strategy"],
  services: ["discovery facilitation", "scope definition"],
  proofPoints: ["Synthetic demonstration profile."],
};

const workflow: WorkflowResult = {
  workflowId: "workflow-ui-001",
  createdAt: "2026-09-08T12:00:00.000Z",
  consultant,
  inquiry: {
    consultantId: consultant.id,
    clientName: "Taylor Client",
    company: "Acme Demo Co.",
    challenge: "The team needs a clearer way to scope incoming work.",
    desiredOutcome: "A repeatable discovery and proposal workflow.",
  },
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
      {
        title: "Prepare the discovery agenda",
        owner: "consultant",
        dueInDays: 0,
        rationale: "The first session needs a clear working agenda.",
      },
      {
        title: "Share the initial context",
        owner: "client",
        dueInDays: 1,
        rationale: "The consultant needs the existing context before discovery.",
      },
    ],
  },
};

async function loadForm() {
  render(<App />);
  await screen.findByRole("radio", { name: /Cedar Finch/i });
}

async function fillRequiredInquiry() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Client name"), "Taylor Client");
  await user.type(screen.getByLabelText("Company"), "Acme Demo Co.");
  await user.type(
    screen.getByLabelText("What challenge are you trying to solve?"),
    "The team needs a clearer way to scope incoming work.",
  );
  await user.type(
    screen.getByLabelText("What outcome would make this useful?"),
    "A repeatable discovery and proposal workflow.",
  );
  return user;
}

describe("ScopePilot consultant cockpit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getConsultants.mockResolvedValue([consultant]);
  });

  it("shows a loading state while consultant profiles are requested", async () => {
    let resolveConsultants: (value: ConsultantProfile[]) => void = () => undefined;
    mocks.getConsultants.mockReturnValue(
      new Promise<ConsultantProfile[]>((resolve) => {
        resolveConsultants = resolve;
      }),
    );

    render(<App />);

    expect(screen.getByText("Loading consultant profiles...")).toBeInTheDocument();
    resolveConsultants([consultant]);

    expect(await screen.findByRole("radio", { name: /Cedar Finch/i })).toBeInTheDocument();
  });

  it("submits the inquiry and exposes a clear workflow loading state", async () => {
    await loadForm();
    const user = await fillRequiredInquiry();
    let resolveWorkflow: (value: WorkflowResult) => void = () => undefined;
    mocks.createWorkflow.mockReturnValue(
      new Promise<WorkflowResult>((resolve) => {
        resolveWorkflow = resolve;
      }),
    );

    await user.click(screen.getByRole("button", { name: "Build workflow" }));

    expect(screen.getByRole("button", { name: "Building workflow..." })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Building your workflow...");
    expect(mocks.createWorkflow).toHaveBeenCalledWith(workflow.inquiry);

    resolveWorkflow(workflow);
    await screen.findByRole("heading", { name: "Discovery brief" });
  });

  it("renders a generic error when workflow generation fails", async () => {
    await loadForm();
    const user = await fillRequiredInquiry();
    mocks.createWorkflow.mockRejectedValue(
      new Error("private credential and inquiry details must not render"),
    );

    await user.click(screen.getByRole("button", { name: "Build workflow" }));

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent("We couldn't build that workflow. Check the details and try again.");
    expect(error).not.toHaveTextContent("private credential");
  });

  it("renders the discovery brief, proposal, and follow-up sections", async () => {
    await loadForm();
    const user = await fillRequiredInquiry();
    mocks.createWorkflow.mockResolvedValue(workflow);

    await user.click(screen.getByRole("button", { name: "Build workflow" }));

    expect(await screen.findByRole("heading", { name: "Discovery brief" })).toBeInTheDocument();
    expect(screen.getByText(workflow.draft.discoveryBrief.summary)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Proposal" })).toBeInTheDocument();
    expect(screen.getByText(workflow.draft.proposal.title)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Follow-up tasks" })).toBeInTheDocument();
    expect(screen.getByText(workflow.draft.followUpTasks[0].rationale)).toBeInTheDocument();
  });

  it("keeps follow-up completion state local to the browser view", async () => {
    await loadForm();
    const user = await fillRequiredInquiry();
    mocks.createWorkflow.mockResolvedValue(workflow);

    await user.click(screen.getByRole("button", { name: "Build workflow" }));
    await screen.findByRole("heading", { name: "Follow-up tasks" });

    const task = screen.getByRole("checkbox", { name: /Confirm the target delivery date/i });
    expect(task).not.toBeChecked();
    await user.click(task);

    expect(task).toBeChecked();
    await user.click(task);
    expect(task).not.toBeChecked();
    expect(mocks.createWorkflow).toHaveBeenCalledTimes(1);
  });

  it("shows a useful error when consultant profiles fail to load", async () => {
    mocks.getConsultants.mockRejectedValue(new Error("catalog unavailable"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "We couldn't load consultant profiles. Refresh and try again.",
      );
    });
  });
});
