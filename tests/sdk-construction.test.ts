import { describe, expect, it } from "vitest";
import { Agent } from "@strands-agents/sdk";
import { BedrockModel } from "@strands-agents/sdk/models/bedrock";

describe("Strands SDK bootstrap", () => {
  it("constructs a Bedrock model and agent without making a model request", () => {
    const model = new BedrockModel({
      modelId: "amazon.nova-lite-v1:0",
      region: "us-east-1",
    });
    const agent = new Agent({ model });

    expect(model).toBeDefined();
    expect(agent).toBeDefined();
  });
});
