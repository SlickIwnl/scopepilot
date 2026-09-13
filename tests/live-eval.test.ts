// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { goodDraft } from "../src/eval/fixtures";
import { LIVE_INVOCATION_CAP, runLiveEvaluation } from "../src/eval/live";
import { runLiveCli } from "../scripts/eval-live";

describe("opt-in live evaluation with faked agents only", () => {
  it.each([
    {}, { allowLive: false, limit: 1 }, { allowLive: "true", limit: 1 },
    { allowLive: true }, { allowLive: true, limit: 0 },
    { allowLive: true, limit: -1 }, { allowLive: true, limit: 1.5 },
    { allowLive: true, limit: 4 }, { allowLive: true, limit: Infinity },
    { allowLive: true, limit: "1" }, { allowLive: true, limit: 1, retries: 1 },
  ])("validates options before even constructing an agent: %j", async (options) => {
    const agentFactory = vi.fn();
    await expect(runLiveEvaluation(options, { agentFactory })).rejects.toThrow("Live evaluation requires");
    expect(agentFactory).not.toHaveBeenCalled();
  });

  it("caps a run at three fresh agents with one invocation each", async () => {
    const invocations: ReturnType<typeof vi.fn>[] = [];
    const agentFactory = vi.fn(() => {
      const invoke = vi.fn(async () => ({ structuredOutput: goodDraft }));
      invocations.push(invoke);
      return { invoke };
    });
    expect(LIVE_INVOCATION_CAP).toBe(3);
    const result = await runLiveEvaluation({ allowLive: true, limit: 3 }, { agentFactory });
    expect(result).toMatchObject({ passed: true, attempts: 3 });
    expect(result.results).toHaveLength(3);
    expect(agentFactory).toHaveBeenCalledTimes(3);
    for (const invoke of invocations) expect(invoke).toHaveBeenCalledTimes(1);
  });

  it.each(["exception", "invalid", "poor"])("stops on %s with no retry and no raw error leakage", async (failure) => {
    const invoke = vi.fn(async () => {
      if (failure === "exception") throw new Error("private AWS credential detail");
      return { structuredOutput: failure === "invalid" ? {} : { ...goodDraft, followUpTasks: [] } };
    });
    const agentFactory = vi.fn(() => ({ invoke }));
    const result = await runLiveEvaluation({ allowLive: true, limit: 3 }, { agentFactory });
    expect(result).toMatchObject({ passed: false, attempts: 1 });
    expect(agentFactory).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(result)).not.toContain("private AWS");
  });

  it.each([[], ["--limit=1"], ["--allow-live"], ["--allow-live", "--limit=4"],
    ["--allow-live", "--limit=1.5"], ["--allow-live", "--limit=1", "--retry"],
    ["--allow-live", "--limit=1", "extra"], ["--allow-live", "--limit=1", "--limit=2"],
  ])("CLI refuses unsafe or ambiguous arguments %j", async (...args) => {
    const agentFactory = vi.fn();
    expect(await runLiveCli(args, { agentFactory, write: vi.fn() })).toBe(1);
    expect(agentFactory).not.toHaveBeenCalled();
  });

  it("CLI reports scored success and propagates failed run status", async () => {
    const write = vi.fn();
    const agentFactory = vi.fn(() => ({ invoke: async () => ({ structuredOutput: goodDraft }) }));
    expect(await runLiveCli(["--allow-live", "--limit=1"], { agentFactory, write })).toBe(0);
    expect(write.mock.calls.flat().join("\n")).toContain("100/100");
    const failingFactory = () => ({ invoke: async () => { throw new Error("secret"); } });
    expect(await runLiveCli(["--allow-live", "--limit=1"], { agentFactory: failingFactory, write })).toBe(1);
    expect(write.mock.calls.flat().join("\n")).not.toContain("secret");
  });
});
