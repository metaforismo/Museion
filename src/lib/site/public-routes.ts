export const PUBLIC_DOCUMENTS = [
  { href: "/about", label: "Our method" },
  { href: "/help", label: "Help" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export const PUBLIC_CONTENT_PATHS: readonly string[] = ["/", ...PUBLIC_DOCUMENTS.map(({ href }) => href)];
export const AUTH_PAGE_PATHS: readonly string[] = ["/login", "/signup"];
export const PUBLIC_PAGE_PATHS: readonly string[] = [...PUBLIC_CONTENT_PATHS, ...AUTH_PAGE_PATHS];
