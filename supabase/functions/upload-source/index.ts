import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import {
  buildEmployeeKey,
  confidenceForRecord,
  normalizeEmail,
  normalizeText
} from "../_shared/reconciliation.ts";

type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    return headers.reduce<CsvRow>((acc, header, index) => {
      acc[header] = (cols[index] ?? "").trim();
      return acc;
    }, {});
  });
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRole);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "file requerido" }), { status: 400 });
    }

    const sourcePriority = Number(form.get("source_priority") ?? 100);
    const text = await file.text();
    const rows = parseCsv(text);

    const { data: batch, error: batchError } = await supabase
      .from("import_batches")
      .insert({
        source_file: file.name,
        source_priority: sourcePriority,
        summary: { total_rows: rows.length }
      })
      .select("id")
      .single();

    if (batchError) throw batchError;
    const batchId = batch.id as string;

    const stagingRows = rows.map((row) => {
      const nombre = row["Usuario (tabla usuarios)"] || row["Usuario (organigrama)"] || row["nombre"] || "";
      const manager = row["Superior (tabla usuarios)"] || row["Superior (organigrama)"] || row["manager"] || "";
      const legajo = row["Legajo usuario"] || row["Legajo"] || row["legajo"] || null;
      const email = row["Email usuario"] || row["email"] || null;
      const cargo = row["Cargo usuario"] || row["cargo"] || null;
      const area = row["Área"] || row["area"] || null;

      const employeeKey = buildEmployeeKey({ legajo, email, nombre });
      const managerKey = manager
        ? buildEmployeeKey({ nombre: manager, email: row["Email superior"] ?? null })
        : null;
      const confidence = confidenceForRecord({
        legajo,
        email,
        manager
      });

      return {
        batch_id: batchId,
        source_file: file.name,
        source_priority: sourcePriority,
        raw_payload: row,
        normalized_fields: {
          nombre: normalizeText(nombre),
          manager: normalizeText(manager),
          email: normalizeEmail(email),
          legajo,
          cargo,
          area,
          confidence
        },
        employee_key: employeeKey,
        manager_key: managerKey,
        status: confidence === "AUTO_OK" ? "READY" : "REVIEW_REQUIRED"
      };
    });

    const { error: stagingError } = await supabase.from("orgchart_staging").insert(stagingRows);
    if (stagingError) throw stagingError;

    for (const row of stagingRows) {
      const normalized = row.normalized_fields as Record<string, string | null>;
      const employeePayload = {
        nombre: row.raw_payload["Usuario (tabla usuarios)"] ?? row.raw_payload["Usuario (organigrama)"] ?? row.employee_key,
        normalized_name: normalized.nombre,
        email: normalized.email,
        legajo: normalized.legajo,
        cargo: normalized.cargo,
        area: normalized.area,
        source_batch_id: batchId
      };

      const { data: byLegajo } = normalized.legajo
        ? await supabase.from("employees").select("id").eq("legajo", normalized.legajo).maybeSingle()
        : { data: null as { id: string } | null };
      const { data: byEmail } = normalized.email
        ? await supabase.from("employees").select("id").eq("email", normalized.email).maybeSingle()
        : { data: null as { id: string } | null };
      const { data: byName } = normalized.nombre
        ? await supabase.from("employees").select("id").eq("normalized_name", normalized.nombre).maybeSingle()
        : { data: null as { id: string } | null };

      let employeeId: string | null = byLegajo?.id ?? byEmail?.id ?? byName?.id ?? null;
      const payload = { ...employeePayload };

      if (byLegajo?.id && byEmail?.id && byLegajo.id !== byEmail.id) {
        await supabase.from("orgchart_conflicts").insert({
          employee_key: row.employee_key,
          conflict_type: "EMAIL_LEGAJO_MISMATCH",
          source_a: "golden",
          source_b: file.name,
          details: { legajo_id: byLegajo.id, email_id: byEmail.id, email: normalized.email, legajo: normalized.legajo }
        });
        employeeId = byLegajo.id as string;
        payload.email = null;
      } else if (byEmail?.id && employeeId && byEmail.id !== employeeId) {
        payload.email = null;
      }

      if (employeeId) {
        const { error: updateError } = await supabase
          .from("employees")
          .update(payload)
          .eq("id", employeeId);
        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("employees")
          .insert(payload)
          .select("id")
          .single();
        if (insertError) throw insertError;
        employeeId = inserted.id as string;
      }

      let managerId: string | null = null;
      const managerName = row.raw_payload["Superior (tabla usuarios)"] ?? row.raw_payload["Superior (organigrama)"];
      if (managerName) {
        const { data: foundManager } = await supabase
          .from("employees")
          .select("id")
          .eq("normalized_name", normalizeText(managerName))
          .maybeSingle();

        if (foundManager?.id) {
          managerId = foundManager.id as string;
        } else {
          await supabase.from("orgchart_conflicts").insert({
            employee_key: row.employee_key,
            conflict_type: "MANAGER_NOT_FOUND",
            source_a: file.name,
            source_b: "golden",
            details: { manager_name: managerName }
          });
        }
      }

      const { data: existingLine } = await supabase
        .from("reporting_lines")
        .select("id, manager_id")
        .eq("employee_id", employeeId)
        .eq("active", true)
        .maybeSingle();

      if (existingLine?.id && existingLine.manager_id && managerId && existingLine.manager_id !== managerId) {
        await supabase.from("orgchart_conflicts").insert({
          employee_key: row.employee_key,
          conflict_type: "MANAGER_MISMATCH",
          source_a: "golden",
          source_b: file.name,
          details: { old_manager_id: existingLine.manager_id, new_manager_id: managerId }
        });
        continue;
      }

      if (!existingLine?.id) {
        await supabase.from("reporting_lines").insert({
          employee_id: employeeId,
          manager_id: managerId,
          source: file.name,
          confidence: normalized.confidence ?? "REVIEW_REQUIRED",
          active: true
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, batch_id: batchId, rows: rows.length }), {
      headers: { "content-type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: (error as Error).message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
});
