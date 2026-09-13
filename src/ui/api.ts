import { z } from "zod";
import {
  ConsultantsResponseSchema,
  WorkflowResultSchema,
  type Inquiry,
  type WorkflowResult,
} from "../shared/contracts";

export type { WorkflowResult };

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

async function request<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error("ScopePilot request failed.");
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("ScopePilot response was invalid.");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new Error("ScopePilot response was invalid.");
  }

  return parsed.data;
}

export async function getConsultants() {
  const result = await request(apiUrl("/api/consultants"), ConsultantsResponseSchema);
  return result.consultants;
}

export function createWorkflow(inquiry: Inquiry): Promise<WorkflowResult> {
  return request(apiUrl("/api/workflows"), WorkflowResultSchema, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(inquiry),
  });
}
