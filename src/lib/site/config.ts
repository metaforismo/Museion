/** Indexing is an explicit release setting; localhost is always excluded. */
export function siteConfiguration(environment: Record<string, string | undefined> = process.env) {
  let url: URL;
  try { url = new URL(environment.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"); }
  catch { url = new URL("http://localhost:3000"); }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) url = new URL("http://localhost:3000");
  const hostname = url.hostname.toLowerCase();
  const local = hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname === "[::1]" || hostname === "::1" || /^127\./.test(hostname) || /^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
  return { origin: url.origin, indexing: environment.MUSEION_PUBLIC_INDEXING === "1" && url.protocol === "https:" && !local };
}

export const SITE = siteConfiguration();
// Reserved example values are deliberate placeholders, never a claimed operator.
export const LEGAL_OPERATOR = {
  name: process.env.MUSEION_OPERATOR_NAME || "Museion Studio (placeholder)",
  country: process.env.MUSEION_OPERATOR_COUNTRY || "Italy (placeholder)",
  email: process.env.MUSEION_OPERATOR_EMAIL || "privacy@museion.example",
  placeholder: !process.env.MUSEION_OPERATOR_NAME || !process.env.MUSEION_OPERATOR_COUNTRY || !process.env.MUSEION_OPERATOR_EMAIL,
};
