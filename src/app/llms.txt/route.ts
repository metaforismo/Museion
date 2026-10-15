import { SITE } from "@/lib/site/config";
import { PUBLIC_DOCUMENTS } from "@/lib/site/public-routes";

export function GET() {
  const content = `# Museion\n\n> A learning workspace with interactive courses, inspectable sources, and Maia, a tutor who guides the next step.\n\n## Public information\n\n- [Landing](${SITE.origin}/): Product overview and authored course catalogue.\n${PUBLIC_DOCUMENTS.map(({ href, label }) => `- [${label}](${SITE.origin}${href})`).join("\n")}\n\n## Product boundaries\n\nLearning workspaces, uploads, account records, and progress require authentication and are private. The public pages do not provide an unauthenticated demo. Progress observations are not qualifications or guarantees of durable mastery. Operator details in the local legal drafts may be placeholders.\n`;
  return new Response(content, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
