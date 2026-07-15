/**
 * Structured logging (server-only): one JSON line per event, ready for
 * any log collector. Keep fields flat and never log learner answers or
 * chat content — ids and counts only.
 */

type LogFields = Record<string, string | number | boolean | null>;

function emit(level: "info" | "warn" | "error", event: string, fields: LogFields) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (event: string, fields: LogFields = {}) => emit("info", event, fields),
  warn: (event: string, fields: LogFields = {}) => emit("warn", event, fields),
  error: (event: string, fields: LogFields = {}) => emit("error", event, fields),
};
