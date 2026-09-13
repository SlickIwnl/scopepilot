import {
  buildWorkflowPrompt,
  createWorkflowAgent,
} from "./factory";
import { WorkflowGenerationError } from "./errors";
import {
  WorkflowDraftSchema,
  type ConsultantProfile,
  type Inquiry,
  type WorkflowDraft,
} from "../shared/contracts";

export interface WorkflowAgent {
  invoke(prompt: string): Promise<{ readonly structuredOutput?: unknown }>;
}

export type WorkflowAgentFactory = () => WorkflowAgent;

export interface WorkflowGenerationDependencies {
  readonly agentFactory?: WorkflowAgentFactory;
}

export async function generateWorkflowDraft(
  inquiry: Inquiry,
  consultant: ConsultantProfile,
  dependencies: WorkflowGenerationDependencies = {},
): Promise<WorkflowDraft> {
  try {
    const agent = (dependencies.agentFactory ?? (() => createWorkflowAgent()))();
    const result = await agent.invoke(buildWorkflowPrompt(inquiry, consultant));
    const parsed = WorkflowDraftSchema.safeParse(result.structuredOutput);

    if (!parsed.success) {
      throw new WorkflowGenerationError("invalid-output");
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof WorkflowGenerationError) {
      throw error;
    }

    throw new WorkflowGenerationError("agent-failure");
  }
}
