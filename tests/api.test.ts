import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/api/app";
import type {
  ConsultantProfile,
  Inquiry,
  WorkflowDraft,
} from "../src/shared/contracts";

const consultant: ConsultantProfile = {
  id: "cedar-finch",
  displayName: "Cedar Finch",
  track: "professional-agents",
  role: "independent-consultant",
  specialties: ["service design", "workflow strategy"],
  services: ["discovery facilitation", "scope definition"],
  proofPoints: ["Synthetic demonstration profile."],
};

const inquiry: Inquiry = {
  consultantId: "cedar-finch",
  clientName: "Taylor Client",
  company: "Acme Demo Co.",
  challenge: "The team needs a clearer way to scope incoming work.",
  desiredOutcome: "A repeatable discovery and proposal workflow.",
};

const draft: WorkflowDraft = {
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

const catalog = {
  listConsultants: () => [consultant],
  getConsultantById: (id: string) => (id === consultant.id ? consultant : undefined),
};

const clock = () => new Date("2026-09-08T12:00:00.000Z");

function createTestApp(
  options: Partial<Parameters<typeof buildApp>[0]> = {},
) {
  return buildApp({
    catalog,
    clock,
    idGenerator: () => "workflow-test-001",
    draftGenerator: async () => draft,
    ...options,
  });
}

const openApps: Array<Awaited<ReturnType<typeof createTestApp>>> = [];

afterEach(async () => {
  await Promise.all(openApps.splice(0).map((app) => app.close()));
});

describe("ScopePilot workflow API", () => {
  it("returns health and only allows the configured UI origin", async () => {
    const app = createTestApp({ uiOrigin: "http://ui.example.test" });
    openApps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/api/health",
      headers: { origin: "http://ui.example.test" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://ui.example.test",
    );
  });

  it("uses the real synthetic catalog when no catalog is injected", async () => {
    const app = buildApp();
    openApps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/api/consultants",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      consultants: [
        {
          id: "cedar-finch",
          displayName: "Cedar Finch",
          track: "professional-agents",
          role: "independent-consultant",
          specialties: ["service design", "workflow strategy", "client operations"],
          services: ["discovery facilitation", "scope definition", "proposal design"],
          proofPoints: [
            "Synthetic demonstration profile for repeatable client discovery.",
            "Synthetic demonstration profile for turning ambiguous needs into bounded work.",
          ],
        },
      ],
    });
  });

  it("does not return an allow-origin header for an unconfigured origin", async () => {
    const app = createTestApp({ uiOrigin: "http://ui.example.test" });
    openApps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/api/health",
      headers: { origin: "http://unconfigured.example.test" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("lists the synthetic consultant catalog", async () => {
    const app = createTestApp();
    openApps.push(app);

    const response = await app.inject({ method: "GET", url: "/api/consultants" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ consultants: [consultant] });
  });

  it("returns a validated workflow with injected deterministic dependencies", async () => {
    const calls: Array<{ inquiry: Inquiry; consultant: ConsultantProfile }> = [];
    const app = createTestApp({
      idGenerator: () => "workflow-injected-001",
      draftGenerator: async (validatedInquiry, selectedConsultant) => {
        calls.push({ inquiry: validatedInquiry, consultant: selectedConsultant });
        return draft;
      },
    });
    openApps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/workflows",
      payload: {
        ...inquiry,
        clientName: ` ${inquiry.clientName} `,
        company: ` ${inquiry.company} `,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      workflowId: "workflow-injected-001",
      createdAt: "2026-09-08T12:00:00.000Z",
      consultant,
      inquiry,
      draft,
    });
    expect(calls).toEqual([{ inquiry, consultant }]);
  });

  it("rejects invalid input before invoking the draft generator", async () => {
    let generationCalls = 0;
    const app = createTestApp({
      draftGenerator: async () => {
        generationCalls += 1;
        return draft;
      },
    });
    openApps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/workflows",
      payload: { ...inquiry, challenge: "too short" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Invalid request body." });
    expect(generationCalls).toBe(0);
  });

  it("returns a generic not-found error for an unknown consultant", async () => {
    let generationCalls = 0;
    const app = createTestApp({
      draftGenerator: async () => {
        generationCalls += 1;
        return draft;
      },
    });
    openApps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/workflows",
      payload: { ...inquiry, consultantId: "does-not-exist" },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Consultant not found." });
    expect(generationCalls).toBe(0);
  });

  it("maps generation failures to a safe bad-gateway response", async () => {
    const secret = "credential-and-inquiry-secret";
    const app = createTestApp({
      draftGenerator: async () => {
        throw new Error(`Bedrock ${secret} failed`);
      },
    });
    openApps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/workflows",
      payload: inquiry,
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({ error: "Workflow generation failed." });
    expect(response.body).not.toContain(secret);
  });

  it("rejects request bodies above the configured limit", async () => {
    const app = createTestApp({ bodyLimit: 200 });
    openApps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/workflows",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ ...inquiry, challenge: "x".repeat(500) }),
    });

    expect(response.statusCode).toBe(413);
    expect(response.json()).toEqual({ error: "Request body too large." });
  });

  it("rate limits the expensive workflow route", async () => {
    let generationCalls = 0;
    const app = createTestApp({
      rateLimit: { maxRequests: 1, windowMs: 60_000 },
      draftGenerator: async () => {
        generationCalls += 1;
        return draft;
      },
    });
    openApps.push(app);

    const first = await app.inject({
      method: "POST",
      url: "/api/workflows",
      payload: inquiry,
    });
    const second = await app.inject({
      method: "POST",
      url: "/api/workflows",
      payload: inquiry,
    });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(429);
    expect(second.json()).toEqual({ error: "Too many workflow requests." });
    expect(generationCalls).toBe(1);
  });
});
