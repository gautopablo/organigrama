import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("supabase migration contract", () => {
  const migration = fs.readFileSync(
    path.resolve("supabase/migrations/20260406_001_init_orgchart.sql"),
    "utf8"
  );

  it("declara tablas core", () => {
    expect(migration).toContain("create table if not exists public.employees");
    expect(migration).toContain("create table if not exists public.reporting_lines");
    expect(migration).toContain("create table if not exists public.orgchart_conflicts");
  });

  it("expone RPC requeridas", () => {
    expect(migration).toContain("function public.get_orgchart");
    expect(migration).toContain("function public.search_employees");
    expect(migration).toContain("function public.update_manager");
    expect(migration).toContain("function public.list_conflicts");
    expect(migration).toContain("function public.resolve_conflict");
  });
});
