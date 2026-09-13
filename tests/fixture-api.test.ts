// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { BedrockModel } from "@strands-agents/sdk/models/bedrock";
import { WorkflowResultSchema } from "../src/shared/contracts";
import { syntheticInquiry } from "../src/eval/fixtures";
import { buildFixtureApp } from "./support/fixture-app";

const apps: ReturnType<typeof buildFixtureApp>[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  vi.restoreAllMocks();
});

describe("offline browser fixture API", () => {
  it("uses the actual HTTP contracts and generator validation without calling Bedrock", async () => {
    const model = vi.spyOn(BedrockModel.prototype, "streamAggregated").mockImplementation(async function* () {
      throw new Error("Bedrock must never be reached");
    });
    const app = buildFixtureApp();
    apps.push(app);
    const response = await app.inject({ method: "POST", url: "/api/workflows", payload: syntheticInquiry });
    expect(response.statusCode).toBe(201);
    const result = WorkflowResultSchema.parse(response.json());
    expect(result.inquiry).toEqual(syntheticInquiry);
    expect(result.draft.discoveryBrief.summary).toContain(syntheticInquiry.challenge);
    expect(result.workflowId).toBe("fixture-workflow");
    expect(model).not.toHaveBeenCalled();
  });

  it("supports a deterministic safe failure and normal API validation", async () => {
    const app = buildFixtureApp();
    apps.push(app);
    for (const [payload, status] of [
      [{ ...syntheticInquiry, company: "FAIL_GENERATION" }, 502],
      [{ ...syntheticInquiry, challenge: "short" }, 400],
      [{ ...syntheticInquiry, consultantId: "unknown" }, 404],
    ] as const) {
      const response = await app.inject({ method: "POST", url: "/api/workflows", payload });
      expect(response.statusCode).toBe(status);
      expect(response.body).not.toContain("fixture failure detail");
    }
  });
});
