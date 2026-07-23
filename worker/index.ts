import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { installSitesRuntime, type ExecutionContextLike } from "../src/lib/sites/runtime";

interface FetcherLike { fetch(request: Request): Promise<Response> }
interface ImageServiceLike { input(stream: ReadableStream): { transform(options: Record<string, unknown>): { output(options: { format: string; quality: number }): Promise<{ response(): Response }> } } }
interface WorkerEnv extends Record<string, unknown> { ASSETS: FetcherLike; IMAGES: ImageServiceLike }

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.openai.com",
};

const worker = {
  async fetch(request: Request, env: WorkerEnv | undefined, ctx: ExecutionContextLike): Promise<Response> {
    const bindings = env ?? ({} as WorkerEnv);
    installSitesRuntime(bindings, ctx);
    if (new URL(request.url).pathname === "/_vinext/image" && bindings.ASSETS && bindings.IMAGES) {
      return handleImageOptimization(request, {
        fetchAsset: (path) => bindings.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await bindings.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES]);
    }
    const response = await handler.fetch(request, bindings, ctx);
    const secured = new Response(response.body, response);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) secured.headers.set(key, value);
    return secured;
  },
};

export default worker;
