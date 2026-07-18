import { timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { enqueueCompilerRun, CompileAudienceSchema, CourseTemplateIdSchema } from "@/lib/compiler";
import { coursePaths } from "@/lib/curriculum";
import { createSourcePack, createSourcePackManifest, publicSourcePackSummary, sourcePackToDocument, SourcePackInputSchema } from "@/lib/source";

const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string().min(1),
  params: z.unknown().optional(),
}).strict();

const ToolCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.string(), z.unknown()).default({}),
}).strict();

const CreateCourseSchema = SourcePackInputSchema.extend({
  audience: CompileAudienceSchema,
  templateId: CourseTemplateIdSchema.default("socratic-foundations"),
  requestId: z.string().uuid().optional(),
}).strict();

export type JsonRpcId = string | number | null;

const sourcePackJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "materials", "rights"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    description: { type: "string", maxLength: 600 },
    materials: {
      type: "array", minItems: 1, maxItems: 8,
      items: {
        type: "object", additionalProperties: false,
        required: ["title", "content"],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 200 },
          content: { type: "string", minLength: 1, maxLength: 200000 },
          mediaType: { type: "string", enum: ["text/plain", "text/markdown"], default: "text/markdown" },
          role: { type: "string", enum: ["primary-source", "transcript", "excerpt", "notes"], default: "primary-source" },
          reference: {
            type: "object", additionalProperties: false, required: ["kind", "url", "label"],
            properties: {
              kind: { type: "string", enum: ["webpage", "youtube_video", "youtube_playlist", "book"] },
              url: { type: "string", format: "uri" },
              label: { type: "string", minLength: 1, maxLength: 200 },
            },
          },
        },
      },
    },
    rights: {
      type: "object", additionalProperties: false, required: ["confirmed", "basis"],
      properties: {
        confirmed: { type: "boolean", const: true },
        basis: { type: "string", enum: ["creator-owned", "licensed", "open-licensed", "public-domain", "authorized-excerpt", "personal-notes"] },
        notes: { type: "string", maxLength: 600 },
      },
    },
  },
} as const;

export const MUSEION_MCP_TOOLS = [
  {
    name: "museion.prepare_source_pack",
    description: "Normalize and hash one user-provided collection of authorized text, notes, transcripts, excerpts, and source references. References are provenance, not evidence without supplied text.",
    inputSchema: sourcePackJsonSchema,
  },
  {
    name: "museion.create_course",
    description: "Run the bounded Course Architect over one authorized Source Pack. Returns an asynchronous run id; deterministic validators still decide whether a course may be published.",
    inputSchema: {
      ...sourcePackJsonSchema,
      required: [...sourcePackJsonSchema.required, "audience"],
      properties: {
        ...sourcePackJsonSchema.properties,
        audience: {
          type: "object", additionalProperties: false,
          required: ["level", "language", "targetMinutes", "learnerGoal"],
          properties: {
            level: { type: "string", enum: ["novice", "intermediate", "advanced"] },
            language: { type: "string", minLength: 2, maxLength: 35 },
            targetMinutes: { type: "integer", minimum: 3, maximum: 60 },
            learnerGoal: { type: "string", minLength: 1, maxLength: 600 },
          },
        },
        templateId: { type: "string", enum: ["socratic-foundations", "exam-practice", "teach-it-back"], default: "socratic-foundations" },
        requestId: { type: "string", format: "uuid" },
      },
    },
  },
  {
    name: "museion.list_originals",
    description: "List the Museion-authored course paths. These remain distinct from courses generated from a user's materials.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
  },
] as const;

function rpcResult(id: JsonRpcId, result: unknown) {
  return { jsonrpc: "2.0" as const, id, result };
}

function rpcError(id: JsonRpcId, code: number, message: string, data?: unknown) {
  return { jsonrpc: "2.0" as const, id, error: { code, message, ...(data === undefined ? {} : { data }) } };
}

function toolText(text: string, structuredContent?: unknown, isError = false) {
  return { content: [{ type: "text" as const, text }], ...(structuredContent === undefined ? {} : { structuredContent }), ...(isError ? { isError: true } : {}) };
}

function authorized(request: Request): boolean {
  const expected = process.env.MUSEION_MCP_TOKEN;
  if (!expected) return false;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export async function handleMcpRequest(request: Request, payload: unknown) {
  const parsed = JsonRpcRequestSchema.safeParse(payload);
  if (!parsed.success) return { status: 400, body: rpcError(null, -32600, "Invalid Request") };
  const { id = null, method, params } = parsed.data;
  if (method === "notifications/initialized" || method === "notifications/cancelled") return { status: 202, body: null };
  if (method === "initialize") {
    return { status: 200, body: rpcResult(id, {
      protocolVersion: "2025-03-26",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "museion-course-architect", version: "0.3.0" },
      instructions: "Museion Originals are the primary learning experience. Use the Course Architect only for authorized user-provided material. A URL alone is provenance, not evidence.",
    }) };
  }
  if (method === "ping") return { status: 200, body: rpcResult(id, {}) };
  if (method === "tools/list") return { status: 200, body: rpcResult(id, { tools: MUSEION_MCP_TOOLS }) };
  if (method !== "tools/call") return { status: 404, body: rpcError(id, -32601, "Method not found") };

  const call = ToolCallSchema.safeParse(params);
  if (!call.success) return { status: 400, body: rpcError(id, -32602, "Invalid tool call") };
  try {
    if (call.data.name === "museion.list_originals") {
      const originals = coursePaths.map(({ id: courseId, title, tagline, subject, learnerBand, estimatedMinutes, lessonIds }) => ({ courseId, title, tagline, subject, learnerBand, estimatedMinutes, lessonCount: lessonIds.length, provenance: "Museion Original" }));
      return { status: 200, body: rpcResult(id, toolText(`Found ${originals.length} Museion Originals.`, { originals })) };
    }
    if (call.data.name === "museion.prepare_source_pack") {
      const input = SourcePackInputSchema.parse(call.data.arguments);
      const pack = await createSourcePack(input);
      const summary = publicSourcePackSummary(pack);
      return { status: 200, body: rpcResult(id, toolText(`Prepared ${summary.title} with ${summary.materialCount} authorized material${summary.materialCount === 1 ? "" : "s"}. Pack hash: ${summary.sha256}.`, { sourcePack: summary })) };
    }
    if (call.data.name === "museion.create_course") {
      if (!authorized(request)) {
        return { status: 200, body: rpcResult(id, toolText("Course creation is locked. Configure MUSEION_MCP_TOKEN on the server and send it as a Bearer token; Museion will not silently spend model quota.", undefined, true)) };
      }
      const input = CreateCourseSchema.parse(call.data.arguments);
      const { audience, templateId, requestId, ...packInput } = input;
      const pack = await createSourcePack(packInput);
      const document = await sourcePackToDocument(pack);
      const manifest = createSourcePackManifest(pack, document);
      const job = await enqueueCompilerRun(`mcp_${pack.sha256.slice(0, 24)}`, document, audience, templateId, requestId, manifest);
      return { status: 200, body: rpcResult(id, toolText(`Course Architect accepted Source Pack ${pack.id}. Compilation ${job.runId} is ${job.status}.`, { sourcePack: publicSourcePackSummary(pack), job })) };
    }
    return { status: 200, body: rpcResult(id, toolText(`Unknown tool: ${call.data.name}`, undefined, true)) };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "The tool input did not satisfy the Source Pack contract."
      : error instanceof Error ? error.message : "The Course Architect failed safely.";
    return { status: 200, body: rpcResult(id, toolText(message, undefined, true)) };
  }
}
