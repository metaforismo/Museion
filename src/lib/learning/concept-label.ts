/** Storage identities stay private; learning surfaces show the concept name. */
export function conceptLabel(identity: string): string {
  const key = identity.startsWith("generated:") ? identity.slice(identity.lastIndexOf(":") + 1) : identity;
  return key.replace(/[-_]+/g, " ");
}
