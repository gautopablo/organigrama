export type MatchConfidence = "AUTO_OK" | "REVIEW_REQUIRED";

export type ParsedInput = {
  legajo?: string | null;
  email?: string | null;
  nombre: string;
  manager?: string | null;
};

export function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeEmail(value: string | null | undefined): string | null {
  const email = normalizeText(value);
  return email.length ? email : null;
}

export function employeeKey(input: ParsedInput): string {
  if (input.legajo?.trim()) return `legajo:${input.legajo.trim()}`;
  const email = normalizeEmail(input.email);
  if (email) return `email:${email}`;
  return `name:${normalizeText(input.nombre)}`;
}

export function scoreConfidence(input: ParsedInput): MatchConfidence {
  const legajo = !!input.legajo?.trim();
  const email = !!normalizeEmail(input.email);
  const manager = !!normalizeText(input.manager).length;
  if ((legajo && email) || (legajo && manager)) return "AUTO_OK";
  return "REVIEW_REQUIRED";
}

export function detectConflictType(previousManagerKey: string | null, incomingManagerKey: string | null) {
  if (!incomingManagerKey) return "MISSING_MANAGER";
  if (previousManagerKey && previousManagerKey !== incomingManagerKey) return "MANAGER_MISMATCH";
  return null;
}
