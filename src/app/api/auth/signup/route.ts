import type { NextRequest } from "next/server";
import { handleAuthRequest } from "@/lib/server/auth-handler";
export const runtime = "nodejs";
export async function POST(request: NextRequest) { return handleAuthRequest(request, "signup"); }
