import { supabase } from "./supabase";
import type { ConflictRow, EmployeeDirectoryRow, OrgNode } from "../types/orgchart";

export async function getOrgchart(root: string | null, depth = 4, area: string | null = null) {
  const { data, error } = await supabase.rpc("get_orgchart", {
    p_root: root,
    p_depth: depth,
    p_area: area
  });
  if (error) throw error;
  return (data ?? []) as OrgNode[];
}

export async function searchEmployees(q = "", area: string | null = null, status: string | null = null) {
  const { data, error } = await supabase.rpc("search_employees", {
    p_q: q,
    p_area: area,
    p_status: status
  });
  if (error) throw error;
  return (data ?? []) as EmployeeDirectoryRow[];
}

export async function updateManager(employeeId: string, managerId: string | null) {
  const { data, error } = await supabase.rpc("update_manager", {
    p_employee_id: employeeId,
    p_manager_id: managerId,
    p_reason: "manual-ui-update"
  });
  if (error) throw error;
  return data;
}

export async function listConflicts(status: string | null = "OPEN", type: string | null = null) {
  const { data, error } = await supabase.rpc("list_conflicts", {
    p_status: status,
    p_type: type
  });
  if (error) throw error;
  return (data ?? []) as ConflictRow[];
}

export async function resolveConflict(conflictId: string, action: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.rpc("resolve_conflict", {
    p_conflict_id: conflictId,
    p_action: action,
    p_payload: payload
  });
  if (error) throw error;
  return data;
}

export async function uploadSource(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data, error } = await supabase.functions.invoke("upload-source", {
    body: formData
  });
  if (error) throw error;
  return data;
}
