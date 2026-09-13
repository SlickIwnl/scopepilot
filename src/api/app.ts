import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { listConsultants } from "../catalog";
import { InquirySchema } from "../shared/contracts";
import { WorkflowGenerationError } from "../agent";
import {
  createWorkflowService,
  UnknownConsultantError,
  type ConsultantCatalog,
  type DraftGenerator,
} from "./workflow";

export interface RateLimitOptions {
  readonly maxRequests?: number;
  readonly windowMs?: number;
  readonly maxClients?: number;
}

export interface AppDependencies {
  readonly catalog?: ConsultantCatalog;
  readonly clock?: () => Date;
  readonly idGenerator?: () => string;
  readonly draftGenerator?: DraftGenerator;
  readonly uiOrigin?: string;
  readonly bodyLimit?: number;
  readonly rateLimit?: RateLimitOptions;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

function createRateLimiter(
  clock: () => Date,
  options: RateLimitOptions = {},
): (clientKey: string) => boolean {
  const maxRequests = Math.max(1, Math.floor(options.maxRequests ?? 10));
  const windowMs = Math.max(1, Math.floor(options.windowMs ?? 60_000));
  const maxClients = Math.max(1, Math.floor(options.maxClients ?? 1_000));
  const buckets = new Map<string, RateLimitBucket>();

  return (clientKey) => {
    const now = clock().getTime();

    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }

    let bucket = buckets.get(clientKey);

    if (!bucket) {
      if (buckets.size >= maxClients) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey) {
          buckets.delete(oldestKey);
        }
      }

      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(clientKey, bucket);
    }

    if (bucket.count >= maxRequests) {
      return false;
    }

    bucket.count += 1;
    return true;
  };
}

export function buildApp(
  dependencies: AppDependencies = {},
): FastifyInstance {
  const app = Fastify({
    logger: false,
    bodyLimit: dependencies.bodyLimit ?? 16_384,
  });
  const clock = dependencies.clock ?? (() => new Date());
  const workflowService = createWorkflowService(dependencies);
  const rateLimiter = createRateLimiter(clock, dependencies.rateLimit);
  const uiOrigin =
    dependencies.uiOrigin?.trim() || process.env.UI_ORIGIN?.trim() || "http://localhost:5173";

  app.register(cors, {
    origin: (origin, callback) => {
      callback(null, origin === uiOrigin ? origin : false);
    },
  });

  app.setErrorHandler((error, _request, reply) => {
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : undefined;

    if (statusCode === 413) {
      return reply.code(413).send({ error: "Request body too large." });
    }

    if (statusCode === 400) {
      return reply.code(400).send({ error: "Invalid request body." });
    }

    return reply.code(500).send({ error: "Internal server error." });
  });

  app.get("/api/health", async () => ({ status: "ok" }));

  app.get("/api/consultants", async () => ({
    consultants: dependencies.catalog?.listConsultants() ?? listConsultants(),
  }));

  app.post(
    "/api/workflows",
    {
      onRequest: async (request, reply) => {
        if (!rateLimiter(request.ip)) {
          await reply.code(429).send({ error: "Too many workflow requests." });
        }
      },
    },
    async (request, reply) => {
      const parsedInquiry = InquirySchema.safeParse(request.body);

      if (!parsedInquiry.success) {
        return reply.code(400).send({ error: "Invalid request body." });
      }

      try {
        const result = await workflowService.createWorkflow(parsedInquiry.data);
        return reply.code(201).send(result);
      } catch (error) {
        if (error instanceof UnknownConsultantError) {
          return reply.code(404).send({ error: "Consultant not found." });
        }

        if (error instanceof WorkflowGenerationError) {
          return reply.code(502).send({ error: "Workflow generation failed." });
        }

        return reply.code(502).send({ error: "Workflow generation failed." });
      }
    },
  );

  return app;
}
