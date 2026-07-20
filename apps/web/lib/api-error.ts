type ValidationIssue = {
  loc?: unknown;
  msg?: unknown;
};

function fieldLabel(location: unknown): string | null {
  if (!Array.isArray(location)) return null;

  const field = [...location]
    .reverse()
    .find((part): part is string => typeof part === "string" && part !== "body");

  if (!field) return null;
  return field.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}

function issueMessage(issue: unknown): string | null {
  if (typeof issue === "string") return issue;
  if (!issue || typeof issue !== "object") return null;

  const { loc, msg } = issue as ValidationIssue;
  if (typeof msg !== "string") return null;

  const field = fieldLabel(loc);
  return field ? `${field}: ${msg}` : msg;
}

export function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (!payload || typeof payload !== "object") return fallback;

  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const messages = detail.map(issueMessage).filter((message): message is string => Boolean(message));
    if (messages.length > 0) return messages.join(" ");
  }

  if (detail && typeof detail === "object") {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
}
