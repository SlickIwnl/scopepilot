import { describe, expect, it } from "vitest";
import {
  ConsultantProfileSchema,
  InquirySchema,
  WorkflowDraftSchema,
} from "../src/shared/contracts";
import { getConsultantById } from "../src/catalog";

describe("ScopePilot contracts", () => {
  it("parses and trims a valid inquiry", () => {
    const result = InquirySchema.safeParse({
      consultantId: "  cedar-finch  ",
      clientName: "  Taylor Client  ",
      company: "  Acme Demo Co.  ",
      challenge: "  The team needs a clearer way to scope incoming work.  ",
      desiredOutcome: "  A repeatable discovery and proposal workflow.  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        consultantId: "cedar-finch",
        clientName: "Taylor Client",
        company: "Acme Demo Co.",
        challenge: "The team needs a clearer way to scope incoming work.",
        desiredOutcome: "A repeatable discovery and proposal workflow.",
      });
    }
  });

  it("rejects inquiry fields that are too short", () => {
    const result = InquirySchema.safeParse({
      consultantId: "x",
      clientName: "x",
      company: "x",
      challenge: "x",
      desiredOutcome: "x",
    });

    expect(result.success).toBe(false);
  });

  it("accepts only the catalog consultant track and role", () => {
    const consultant = {
      id: "cedar-finch",
      displayName: "Cedar Finch",
      track: "professional-agents",
      role: "independent-consultant",
      specialties: ["service design"],
      services: ["discovery facilitation"],
      proofPoints: ["Synthetic demonstration profile."],
    };

    expect(ConsultantProfileSchema.safeParse(consultant).success).toBe(true);
    expect(
      ConsultantProfileSchema.safeParse({ ...consultant, track: "other-track" }).success,
    ).toBe(false);
    expect(
      ConsultantProfileSchema.safeParse({ ...consultant, role: "other-role" }).success,
    ).toBe(false);
  });

  it("rejects malformed workflow drafts", () => {
    const result = WorkflowDraftSchema.safeParse({
      discoveryBrief: {
        summary: "A summary",
        goals: ["A goal"],
        constraints: [],
        openQuestions: [],
      },
      proposal: {
        title: "A proposal",
        summary: "A proposal summary",
        scope: "A bounded scope",
        deliverables: ["A deliverable"],
        timeline: "Two weeks",
      },
      followUpTasks: [
        {
          title: "Confirm scope",
          owner: "vendor",
          dueInDays: 3,
          rationale: "The owner value is invalid.",
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe("consultant catalog", () => {
  it("returns undefined for an unknown consultant ID", () => {
    expect(getConsultantById("does-not-exist")).toBeUndefined();
  });
});
