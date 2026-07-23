import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const PLACEHOLDER_DATABASE_ID = "00000000-0000-4000-8000-000000000000";
const { d1, r2 } = hostingConfig;

export default defineConfig(async () => {
  process.env.MUSEION_RUNTIME = "sites";
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  const codexRuntimeStub = new URL("./src/lib/ai/codex-runtime.sites.ts", import.meta.url).pathname;
  const codexCompilerStub = new URL("./src/lib/compiler/providers/codex.sites.ts", import.meta.url).pathname;
  return {
    plugins: [
      {
        name: "museion-sites-node-stubs",
        enforce: "pre" as const,
        resolveId(source: string, importer?: string) {
          if (source === "@/lib/ai/codex-runtime" || source.endsWith("/ai/codex-runtime") || source.endsWith("/ai/codex-runtime.ts") || (source === "./codex-runtime" && importer?.includes("/lib/ai/"))) return codexRuntimeStub;
          if ((source === "./providers/codex" && importer?.endsWith("/compiler/runs.ts")) || source === "@/lib/compiler/providers/codex") return codexCompilerStub;
          return null;
        },
      },
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: {
          main: "./worker/index.ts",
          compatibility_flags: ["nodejs_compat"],
          d1_databases: d1 ? [{ binding: d1, database_name: "museion-sites", database_id: PLACEHOLDER_DATABASE_ID }] : [],
          r2_buckets: r2 ? [{ binding: r2, bucket_name: "museion-uploads" }] : [],
        },
      }),
    ],
  };
});
