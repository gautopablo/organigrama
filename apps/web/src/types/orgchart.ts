export type OrgNode = {
  employee_id: string;
  legajo: string | null;
  manager_id: string | null;
  nombre: string;
  email: string | null;
  cargo: string | null;
  area: string | null;
  division: string | null;
  level: number;
  confidence: "AUTO_OK" | "REVIEW_REQUIRED";
  source: string | null;
  active: boolean;
};

export type EmployeeDirectoryRow = {
  id: string;
  legajo: string | null;
  nombre: string;
  email: string | null;
  cargo: string | null;
  area: string | null;
  division: string | null;
  estado: string;
  manager_id: string | null;
  manager_name: string | null;
  confidence: "AUTO_OK" | "REVIEW_REQUIRED";
  source: string | null;
  active: boolean;
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
