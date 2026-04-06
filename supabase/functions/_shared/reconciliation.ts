export type Confidence = "AUTO_OK" | "REVIEW_REQUIRED";

export type NormalizedRecord = {
  employee_key: string;
  manager_key: string | null;
  nombre: string;
  normalized_name: string;
  email: string | null;
  legajo: string | null;
  cargo: string | null;
  area: string | null;
  confidence: Confidence;
};

export function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeEmail(value: string | null | undefined): string | null {
  const email = normalizeText(value);
  return email.length ? email : null;
}

export function buildEmployeeKey(input: {
  legajo?: string | null;
  email?: string | null;
  nombre: string;
}) {
  if (input.legajo && input.legajo.trim()) return `legajo:${input.legajo.trim()}`;
  if (input.email && input.email.trim()) return `email:${normalizeEmail(input.email)}`;
  return `name:${normalizeText(input.nombre)}`;
}

export function confidenceForRecord(input: {
  legajo?: string | null;
  email?: string | null;
  manager?: string | null;
}): Confidence {
  if (input.legajo && input.email && input.manager) return "AUTO_OK";
  if (input.legajo && input.email) return "AUTO_OK";
  return "REVIEW_REQUIRED";
}
