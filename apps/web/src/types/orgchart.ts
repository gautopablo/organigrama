export type OrgNode = {
  employee_id: string;
  manager_id: string | null;
  nombre: string;
  email: string | null;
  cargo: string | null;
  area: string | null;
  level: number;
  confidence: "AUTO_OK" | "REVIEW_REQUIRED";
  source: string | null;
};

export type EmployeeDirectoryRow = {
  id: string;
  legajo: string | null;
  nombre: string;
  email: string | null;
  cargo: string | null;
  area: string | null;
  estado: string;
  manager_name: string | null;
  confidence: "AUTO_OK" | "REVIEW_REQUIRED";
  source: string | null;
};

export type ConflictRow = {
  id: string;
  employee_key: string;
  conflict_type: string;
  source_a: string;
  source_b: string;
  status: "OPEN" | "RESOLVED" | "DISCARDED";
  details: Record<string, unknown>;
  created_at: string;
};
