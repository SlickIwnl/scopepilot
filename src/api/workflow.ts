import { randomUUID } from "node:crypto";
import { generateWorkflowDraft } from "../agent";
import { getConsultantById, listConsultants } from "../catalog";
import type {
  ConsultantProfile,
  Inquiry,
  WorkflowDraft,
  WorkflowResult,
} from "../shared/contracts";

export interface ConsultantCatalog {
  readonly listConsultants: () => readonly ConsultantProfile[];
  readonly getConsultantById: (id: string) => ConsultantProfile | undefined;
}

export type DraftGenerator = (
  inquiry: Inquiry,
  consultant: ConsultantProfile,
) => Promise<WorkflowDraft>;

export interface WorkflowServiceDependencies {
  readonly catalog?: ConsultantCatalog;
  readonly clock?: () => Date;
  readonly idGenerator?: () => string;
  readonly draftGenerator?: DraftGenerator;
}

export class UnknownConsultantError extends Error {
  constructor() {
    super("Consultant not found.");
    this.name = "UnknownConsultantError";
  }
}

const defaultCatalog: ConsultantCatalog = {
  listConsultants,
  getConsultantById,
};

const defaultDraftGenerator: DraftGenerator = (inquiry, consultant) =>
  generateWorkflowDraft(inquiry, consultant);

export function createWorkflowService(
  dependencies: WorkflowServiceDependencies = {},
): {
  readonly createWorkflow: (inquiry: Inquiry) => Promise<WorkflowResult>;
} {
  const catalog = dependencies.catalog ?? defaultCatalog;
  const clock = dependencies.clock ?? (() => new Date());
  const idGenerator = dependencies.idGenerator ?? randomUUID;
  const draftGenerator = dependencies.draftGenerator ?? defaultDraftGenerator;

  return {
    async createWorkflow(inquiry) {
      const consultant = catalog.getConsultantById(inquiry.consultantId);

      if (!consultant) {
        throw new UnknownConsultantError();
      }

      const draft = await draftGenerator(inquiry, consultant);

      return {
        workflowId: idGenerator(),
        createdAt: clock().toISOString(),
        consultant,
        inquiry,
        draft,
      };
    },
  };
}
