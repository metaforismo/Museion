import { NextResponse } from "next/server";

import { compilerFailurePayload, enqueueCompilerRun, CompilerRunRequestSchema } from "@/lib/compiler";
import {
  createSingleDocumentSourcePackManifest,
  createSourcePackManifest,
  sourcePackToDocument,
  verifySourceDocumentIntegrity,
  verifySourcePackIntegrity,
} from "@/lib/source";
import { requireAccountActor } from "@/lib/server/actor";
import { consumeUsage } from "@/lib/server/usage";

export async function POST(request: Request) {
  let actor;
  try { actor = await requireAccountActor(); } catch { return NextResponse.json({ error: "CHATGPT_SIGN_IN_REQUIRED", signIn: "/signin-with-chatgpt?return_to=/create" }, { status: 401 }); }
  const parsed = CompilerRunRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_COMPILER_REQUEST" }, { status: 400 });
  if (!await consumeUsage(actor.ownerId, "compiler")) return NextResponse.json({ error: "DAILY_COMPILER_QUOTA_EXCEEDED", retryable: true }, { status: 429 });
  try {
    let document = parsed.data.document;
    let sourcePackManifest;
    if (parsed.data.sourcePack) {
      await verifySourcePackIntegrity(parsed.data.sourcePack);
      const expectedDocument = await sourcePackToDocument(parsed.data.sourcePack);
      if (expectedDocument.sha256 !== document.sha256) throw new Error("SOURCE_PACK_DOCUMENT_MISMATCH");
      document = expectedDocument;
      sourcePackManifest = createSourcePackManifest(parsed.data.sourcePack, document);
    } else {
      await verifySourceDocumentIntegrity(document);
      sourcePackManifest = await createSingleDocumentSourcePackManifest(document, parsed.data.rights);
    }
    const response = NextResponse.json(
      await enqueueCompilerRun(
        actor.ownerId,
        document,
        parsed.data.audience,
        parsed.data.templateId,
        parsed.data.requestId,
        sourcePackManifest,
      ),
      { status: 202 },
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const payload = compilerFailurePayload(error);
    const status = payload.error === "LIVE_COMPILER_NOT_CONFIGURED" ? 503 : ["COMPILER_RUN_QUOTA_EXCEEDED", "COMPILER_JOB_ALREADY_RUNNING"].includes(payload.error) ? 429 : 422;
    return NextResponse.json(payload, { status });
  }
}
