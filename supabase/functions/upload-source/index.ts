import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import Papa from "https://esm.sh/papaparse@5.4.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// CORRECTED PATH: Shared logic is in ../_shared/
// Inlined normalization logic to avoid import path issues in Edge Functions
function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeEmail(value: string | null | undefined): string | null {
  const email = normalizeText(value);
  return email.length ? email : null;
}

type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: "greedy", // More robust for trailing commas
    transformHeader: (h) => h.trim()
  });
  if (result.errors.length > 0) {
    console.warn("[CSV Parse] Errors encountered:", result.errors);
  }
  return result.data as CsvRow[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRole);

    console.log("[Request] Method:", req.method, "URL:", req.url);

    const form = await req.formData().catch((e: any) => {
        console.error("[Request] Failed to parse formData:", e);
        throw new Error("Cargando archivo: Formato de cuerpo inválido");
    });

    const file = form.get("file");
    if (!(file instanceof File)) {
      console.error("[Request] No file found in formData");
      return new Response(JSON.stringify({ error: "Archivo requerido (campo 'file')" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    console.log(`[Process] File: ${file.name}, size: ${file.size} bytes`);
    const text = await file.text();
    const rows = parseCsv(text);
    console.log(`[Process] Parsed ${rows.length} rows from CSV`);

    if (rows.length === 0) {
        throw new Error("El archivo CSV está vacío o no se ha podido procesar");
    }

    // Normalize rows for the RPC
    const preparedRows = rows.map((row, idx) => {
      // Extensive mapping for all known variations in user's exports
      const nombre = 
        row["Nombre"] || 
        row["nombre"] || 
        row["Nombre completo"] || 
        row["Nombre Completo"] || 
        row["Usuario (tabla usuarios)"] || 
        row["Usuario (organigrama)"] || 
        "";
      
      const managerName = 
        row["Superior"] || 
        row["Reporta a"] || 
        row["Superior (tabla usuarios)"] || 
        row["Superior (organigrama)"] || 
        row["manager"] || 
        row["Manager"] || 
        "";
      
      const legajo = 
        row["Legajo"] || 
        row["legajo"] || 
        row["Legajo usuario"] || 
        row["Legajo Usuario"] || 
        null;

      const email = 
        row["Email"] || 
        row["email"] || 
        row["Correo"] || 
        row["Email usuario"] || 
        null;

      const cargo = 
        row["Cargo"] || 
        row["cargo"] || 
        row["Puesto"] || 
        row["puesto"] || 
        row["Cargo usuario"] || 
        null;

      const area = 
        row["Área"] || 
        row["area"] || 
        row["Area"] || 
        null;

      const division = 
        row["División"] || 
        row["division"] || 
        row["división"] || 
        row["Division"] || 
        null;
      
      const managerEmail = 
        row["Email Superior"] || 
        row["Email superior"] || 
        row["Superior Email"] || 
        row["manager_email"] || 
        null;
      
      const activeAttr = 
        row["Active"] || 
        row["active"] || 
        row["Activo"] || 
        row["activo"] || 
        null;

      // Logic to determine boolean value for 'active'
      let active: boolean | null = null;
      if (activeAttr !== null) {
        const val = String(activeAttr).toLowerCase().trim();
        if (val === "true" || val === "1" || val === "sí" || val === "si" || val === "active" || val === "activo") {
          active = true;
        } else if (val === "false" || val === "0" || val === "no" || val === "inactive" || val === "inactivo") {
          active = false;
        }
      }

      if (idx === 0) {
        console.log("[Process] Sample mapping for row 0:", { nombre, email, legajo, managerName, managerEmail, active });
      }

      // Basic validation: skip rows without name
      if (!nombre && !email) return null;

      return {
        nombre: String(nombre).trim(),
        email: normalizeEmail(email),
        legajo: legajo ? String(legajo).trim() : null,
        cargo: cargo ? String(cargo).trim() : null,
        area: area ? String(area).trim() : null,
        division: division ? String(division).trim() : null,
        manager_name: managerName ? String(managerName).trim() : null,
        manager_email: normalizeEmail(managerEmail),
        active: active // If null, RPC defaults to true
      };
    }).filter(row => row !== null);

    console.log(`[Database] Invoking import_directory_upsert with ${preparedRows.length} valid rows`);
    
    const { data: result, error: rpcError } = await supabase.rpc("import_directory_upsert", {
      p_rows: preparedRows
    });

    if (rpcError) {
      console.error("[Database] RPC Error:", rpcError);
      throw rpcError;
    }

    console.log("[Database] Import successful. Snapshot ID:", result?.snapshot_id);

    return new Response(JSON.stringify({ 
      ok: true, 
      snapshot_id: result?.snapshot_id || "N/A",
      rows_processed: preparedRows.length,
      stats: result
    }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });

  } catch (error) {
    console.error("[Error] Critical failure in upload-source:", error);
    return new Response(JSON.stringify({ 
        ok: false, 
        error: (error as Error).message,
        details: "Check Supabase Function logs for more information."
    }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});


