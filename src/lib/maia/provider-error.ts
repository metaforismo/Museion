export type TutorProviderErrorCode =
  | "provider_http_error"
  | "provider_invalid_response"
  | "provider_response_too_large"
  | "provider_not_configured"
  | "provider_context_limit"
  | "provider_timeout"
  | "provider_cancelled"
  | "provider_network_error"
  | "provider_error";

/** Safe diagnostics have fixed codes and, for HTTP failures, a status number.
 * They never contain upstream messages, bodies, candidates or credentials. */
export class TutorProviderError extends Error {
  readonly name = "TutorProviderError";

  constructor(readonly code: TutorProviderErrorCode, readonly httpStatus: number | null = null) {
    super(code);
  }
}

export function tutorProviderErrorDiagnostic(error: unknown): { errorCode: TutorProviderErrorCode; httpStatus: number | null } {
  if (error instanceof TutorProviderError) {
    return {
      errorCode: error.code,
      httpStatus: Number.isInteger(error.httpStatus) && error.httpStatus! >= 100 && error.httpStatus! <= 599 ? error.httpStatus : null,
    };
  }
  if (error instanceof Error && error.name === "TimeoutError") return { errorCode: "provider_timeout", httpStatus: null };
  if (error instanceof Error && error.name === "AbortError") return { errorCode: "provider_cancelled", httpStatus: null };
  if (error instanceof TypeError) return { errorCode: "provider_network_error", httpStatus: null };
  return { errorCode: "provider_error", httpStatus: null };
}
