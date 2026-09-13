import { z } from "zod";

const inquiryText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

const workflowText = z.string().trim().min(1).max(2_000);
const workflowList = z.array(workflowText).max(12);

export const InquirySchema = z.strictObject({
  consultantId: inquiryText(1, 100),
  clientName: inquiryText(2, 120),
  company: inquiryText(2, 160),
  challenge: inquiryText(10, 2_000),
  desiredOutcome: inquiryText(10, 2_000),
});

export type Inquiry = z.infer<typeof InquirySchema>;

const consultantList = z.array(inquiryText(1, 500)).max(12);

export const ConsultantProfileSchema = z.strictObject({
  id: inquiryText(1, 100),
  displayName: inquiryText(2, 120),
  track: z.literal("professional-agents"),
  role: z.literal("independent-consultant"),
  specialties: consultantList,
  services: consultantList,
  proofPoints: consultantList,
});

export type ConsultantProfile = z.infer<typeof ConsultantProfileSchema>;

export const ConsultantsResponseSchema = z.strictObject({
  consultants: z.array(ConsultantProfileSchema),
});

export type ConsultantsResponse = z.infer<typeof ConsultantsResponseSchema>;

export const DiscoveryBriefSchema = z.strictObject({
  summary: workflowText,
  goals: workflowList,
  constraints: workflowList,
  openQuestions: workflowList,
});

export type DiscoveryBrief = z.infer<typeof DiscoveryBriefSchema>;

export const ProposalSchema = z.strictObject({
  title: workflowText,
  summary: workflowText,
  scope: workflowText,
  deliverables: workflowList,
  timeline: workflowText,
});

export type Proposal = z.infer<typeof ProposalSchema>;

export const FollowUpTaskSchema = z.strictObject({
  title: workflowText,
  owner: z.enum(["consultant", "client"]),
  dueInDays: z.number().int().min(0).max(365),
  rationale: workflowText,
});

export type FollowUpTask = z.infer<typeof FollowUpTaskSchema>;

export const WorkflowDraftSchema = z.strictObject({
  discoveryBrief: DiscoveryBriefSchema,
  proposal: ProposalSchema,
  followUpTasks: z.array(FollowUpTaskSchema).max(12),
});

export type WorkflowDraft = z.infer<typeof WorkflowDraftSchema>;

export const WorkflowResultSchema = z.strictObject({
  workflowId: inquiryText(1, 200),
  createdAt: z.iso.datetime(),
  consultant: ConsultantProfileSchema,
  inquiry: InquirySchema,
  draft: WorkflowDraftSchema,
});

export type WorkflowResult = z.infer<typeof WorkflowResultSchema>;
