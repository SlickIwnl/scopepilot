import { z } from "zod";
import { generateWorkflowDraft, type WorkflowGenerationDependencies } from "../agent/workflow";
import { getConsultantById } from "../catalog";
import { ConsultantProfileSchema, InquirySchema } from "../shared/contracts";
import { syntheticInquiry } from "./fixtures";
import { scoreDraft, type DraftScore } from "./scoring";

export const LIVE_INVOCATION_CAP = 3;

export interface LiveEvaluationResult {
  passed: boolean;
  attempts: number;
  results: DraftScore[];
}

const LiveOptionsSchema = z.strictObject({
  allowLive: z.literal(true),
  limit: z.number().int().min(1).max(LIVE_INVOCATION_CAP),
});

export async function runLiveEvaluation(
  options: unknown,
  dependencies: WorkflowGenerationDependencies = {},
): Promise<LiveEvaluationResult> {
  const parsed = LiveOptionsSchema.safeParse(options);
  if (!parsed.success) {
    throw new Error(`Live evaluation requires explicit allowLive=true and an integer limit from 1 to ${LIVE_INVOCATION_CAP}.`);
  }

  const inquiry = InquirySchema.parse(syntheticInquiry);
  const consultant = ConsultantProfileSchema.parse(getConsultantById(inquiry.consultantId));
  const results: DraftScore[] = [];
  for (let attempt = 0; attempt < parsed.data.limit; attempt += 1) {
    try {
      results.push(scoreDraft(await generateWorkflowDraft(inquiry, consultant, dependencies)));
    } catch {
      results.push({ passed: false, score: 0, failures: ["generation: Workflow generation failed; no retry was attempted."] });
    }
    if (!results[results.length - 1].passed) break;
  }
  return { passed: results.every((result) => result.passed), attempts: results.length, results };
}
