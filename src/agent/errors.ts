export type WorkflowGenerationErrorCode =
  | "configuration"
  | "invalid-output"
  | "agent-failure";

const errorMessages: Record<WorkflowGenerationErrorCode, string> = {
  configuration: "Workflow generation is not configured.",
  "invalid-output": "Workflow generation returned invalid structured output.",
  "agent-failure": "Workflow generation failed.",
};

export class WorkflowGenerationError extends Error {
  readonly code: WorkflowGenerationErrorCode;

  constructor(code: WorkflowGenerationErrorCode) {
    super(errorMessages[code]);
    this.name = "WorkflowGenerationError";
    this.code = code;
  }
}
