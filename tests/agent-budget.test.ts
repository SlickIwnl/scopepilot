// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextWindowOverflowError, Message, ModelThrottledError, TextBlock, ToolUseBlock } from "@strands-agents/sdk";
import { BedrockModel } from "@strands-agents/sdk/models/bedrock";
import { createWorkflowAgent } from "../src/agent";
import { goodDraft } from "../src/eval/fixtures";

const captured = vi.hoisted(() => ({ modelOptions: vi.fn() }));
vi.mock("@strands-agents/sdk/models/bedrock", async (importOriginal) => {
  const original = await importOriginal<typeof import("@strands-agents/sdk/models/bedrock")>();
  return {
    ...original,
    BedrockModel: class extends original.BedrockModel {
      constructor(options: ConstructorParameters<typeof original.BedrockModel>[0]) {
        captured.modelOptions(options);
        super(options);
      }
    },
  };
});

afterEach(() => vi.restoreAllMocks());

describe("single Bedrock model-call budget", () => {
  it("returns validated structured output through the real Strands loop in one model call", async () => {
    const agent = createWorkflowAgent({ BEDROCK_MODEL_ID: "test.model" });
    const stream = vi.spyOn(BedrockModel.prototype, "streamAggregated").mockImplementation(async function* () {
      return {
        message: new Message({ role: "assistant", content: [new ToolUseBlock({ name: "strands_structured_output", toolUseId: "fake-1", input: goodDraft })] }),
        stopReason: "toolUse",
      };
    });
    await expect(agent.invoke("Synthetic inquiry only")).resolves.toMatchObject({ structuredOutput: goodDraft });
    expect(stream).toHaveBeenCalledTimes(1);
  });

  it.each([new ModelThrottledError("fake throttle"), new ContextWindowOverflowError("fake overflow")])(
    "propagates %s without a retry or recovery call", async (error) => {
      const agent = createWorkflowAgent({ BEDROCK_MODEL_ID: "test.model" });
      const stream = vi.spyOn(BedrockModel.prototype, "streamAggregated").mockImplementation(async function* () { throw error; });
      await expect(agent.invoke("Synthetic inquiry only")).rejects.toBe(error);
      expect(stream).toHaveBeenCalledTimes(1);
    },
  );

  it("disables AWS transport retries and native token-count calls", () => {
    createWorkflowAgent({ BEDROCK_MODEL_ID: "test.model" });
    expect(captured.modelOptions).toHaveBeenLastCalledWith(expect.objectContaining({
      clientConfig: expect.objectContaining({ maxAttempts: 1 }),
      useNativeTokenCount: false,
    }));
  });

  it.each(["plain text", "invalid structured output"])("blocks SDK repair of %s before a second model call", async (kind) => {
    const agent = createWorkflowAgent({ BEDROCK_MODEL_ID: "test.model" });
    let calls = 0;
    const stream = vi.spyOn(BedrockModel.prototype, "streamAggregated").mockImplementation(async function* () {
      calls += 1;
      if (calls > 1) throw new Error("Second model call reached");
      return kind === "plain text"
        ? { message: new Message({ role: "assistant", content: [new TextBlock("No tool output")] }), stopReason: "endTurn" }
        : { message: new Message({ role: "assistant", content: [new ToolUseBlock({ name: "strands_structured_output", toolUseId: "fake-1", input: {} })] }), stopReason: "toolUse" };
    });
    await expect(agent.invoke("Synthetic inquiry only")).rejects.toThrow();
    expect(stream).toHaveBeenCalledTimes(1);
  });
});
