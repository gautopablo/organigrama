import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import Papa from "https://esm.sh/papaparse@5.4.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import {
  normalizeEmail
} from "./reconciliation.ts";

type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim()
  });
  if (result.errors.length > 0) {
    console.warn("CSV Parse errors:", result.errors);
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

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "file requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);
    const text = await file.text();
    const rows = parseCsv(text);
    console.log(`Parsed ${rows.length} rows from CSV`);

    // Normalize rows for the RPC
    const preparedRows = rows.map((row, idx) => {
      // Expanded mapping to match user's actual CSV headers
      const nombre = 
        row["Nombre"] || 
        row["nombre"] || 
        row["Usuario (tabla usuarios)"] || 
        row["Usuario (organigrama)"] || 
        "";
      
      const managerName = 
        row["Reporta a"] || 
        row["Superior (tabla usuarios)"] || 
        row["Superior (organigrama)"] || 
        row["manager"] || 
        row["Manager"] || 
        "";
      
      const legajo = row["Legajo"] || row["legajo"] || row["Legajo usuario"] || null;
      const email = row["Email"] || row["email"] || row["Email usuario"] || null;
      const cargo = row["Cargo"] || row["cargo"] || row["Cargo usuario"] || null;
      const area = row["Área"] || row["area"] || row["Area"] || null;
      const division = row["División"] || row["division"] || row["división"] || row["Division"] || null;
      
      const managerEmail = 
        row["Email Superior"] || 
        row["Email superior"] || 
        row["manager_email"] || 
        null;

      if (idx === 0) {
        console.log("Sample row 0 mapping:", { nombre, email, legajo, managerName, managerEmail });
      }

      return {
        nombre,
        email: normalizeEmail(email),
        legajo: legajo ? String(legajo) : null,
        cargo,
        area,
        division,
        manager_name: managerName,
        manager_email: normalizeEmail(managerEmail)
      };
    });

    console.log(`Invoking import_directory_wipe_load with ${preparedRows.length} normalized rows`);
    const { data: result, error: rpcError } = await supabase.rpc("import_directory_wipe_load", {
      p_rows: preparedRows
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      throw rpcError;
    }

    console.log("RPC Success result:", result);

    return new Response(JSON.stringify({ 
      ok: true, 
      batch_id: result?.snapshot_id || "N/A",
      rows: preparedRows.length,
      stats: result
    }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });

  } catch (error) {
    console.error("Import error details:", error);
    return new Response(JSON.stringify({ ok: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});

