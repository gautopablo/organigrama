import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for bypass RLS

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function load() {
  const employeesData = JSON.parse(fs.readFileSync("data_local.json", "utf8"));
  console.log(`Cargando ${employeesData.length} empleados...`);

  // 1. Crear Batch de importación
  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      source_file: "combined_local_import",
      source_priority: 1,
      summary: { total: employeesData.length }
    })
    .select()
    .single();

  if (batchError) {
    console.error("Error creando batch:", batchError);
    return;
  }
  console.log("Batch creado:", batch.id);

  // 2. Limpiar tablas (en orden de dependencias)
  console.log("Limpiando tablas previas...");
  await supabase.from("reporting_lines").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("employees").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // 3. Insertar Empleados
  const employeesToInsert = employeesData.map(e => ({
    legajo: e.legajo,
    nombre: e.nombre,
    normalized_name: e.nombre.toLowerCase().trim(), // Fallback simple de normalización
    email: e.email || null,
    cargo: e.cargo || null,
    area: e.area || null,
    source_batch_id: batch.id,
    estado: 'ACTIVE'
  }));

  // Insertar en chunks de 100 para evitar límites
  const chunkSize = 100;
  for (let i = 0; i < employeesToInsert.length; i += chunkSize) {
    const chunk = employeesToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from("employees").insert(chunk);
    if (error) {
      console.error(`Error insertando empleados (chunk ${i}):`, error);
      return;
    }
    console.log(`  Inserción empleados: ${i + chunk.length}/${employeesData.length}`);
  }

  // 4. Obtener todos los empleados insertados para tener sus UUIDs
  const { data: dbEmployees, error: fetchError } = await supabase
    .from("employees")
    .select("id, legajo");
  
  if (fetchError) {
    console.error("Error obteniendo empleados cargados:", fetchError);
    return;
  }

  const legajoToUuid = new Map();
  dbEmployees.forEach(e => legajoToUuid.set(e.legajo, e.id));

  // 5. Insertar Reporting Lines
  const reportingLinesToInsert = employeesData
    .filter(e => e.manager_legajo && legajoToUuid.has(e.legajo) && legajoToUuid.has(e.manager_legajo))
    .map(e => ({
      employee_id: legajoToUuid.get(e.legajo),
      manager_id: legajoToUuid.get(e.manager_legajo),
      source: "bulk_local_import",
      confidence: "AUTO_OK",
      active: true
    }));

  console.log(`Insertando ${reportingLinesToInsert.length} líneas de reporte...`);
  for (let i = 0; i < reportingLinesToInsert.length; i += chunkSize) {
    const chunk = reportingLinesToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from("reporting_lines").insert(chunk);
    if (error) {
      console.error(`Error insertando reporting lines (chunk ${i}):`, error);
      return;
    }
    console.log(`  Inserción líneas: ${i + chunk.length}/${reportingLinesToInsert.length}`);
  }

  console.log("\n✓ ¡Carga completada con éxito!");
  console.log(`- Empleados: ${employeesToInsert.length}`);
  console.log(`- Relaciones: ${reportingLinesToInsert.length}`);
}

load();
