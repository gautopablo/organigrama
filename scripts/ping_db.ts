import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan las credenciales de Supabase en .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log("Probando conexión a Supabase...");
  // Intentamos obtener información de las tablas principales definidas en las migraciones
  const { data: employees, error: errorEmp } = await supabase.from('employees').select('id').limit(1);
  const { data: orgchart, error: errorOrg } = await supabase.from('orgchart_staging').select('id').limit(1);

  if (errorEmp) {
    console.error("Error al acceder a la tabla 'employees':", errorEmp.message);
  } else {
    console.log("Tabla 'employees' OK.");
  }

  if (errorOrg) {
    console.error("Error al acceder a la tabla 'orgchart_staging':", errorOrg.message);
  } else {
    console.log("Tabla 'orgchart_staging' OK.");
  }
}

checkDatabase();
