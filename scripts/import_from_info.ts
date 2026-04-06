import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import xlsx from "xlsx";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

const sourceFiles = [
  { file: "usuarios_superiores_organigrama_oficial.xlsx", priority: 1, sheet: "UsuariosSuperiores" },
  { file: "usuarios_superiores_organigrama_con_cargos.xlsx", priority: 2, sheet: "UsuariosSuperiores" },
  { file: "Listado reporta a.xlsx", priority: 3, sheet: "Hoja1" }
];

async function uploadCsvToEdge(fileName: string, priority: number, csv: string) {
  const form = new FormData();
  form.append("source_priority", String(priority));
  form.append("file", new File([csv], fileName.replace(".xlsx", ".csv"), { type: "text/csv" }));

  const { data, error } = await supabase.functions.invoke("upload-source", {
    body: form
  });
  if (error) throw error;
  return data;
}

async function main() {
  for (const source of sourceFiles) {
    const fullPath = path.resolve("info", source.file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`SKIP: no existe ${source.file}`);
      continue;
    }
    const workbook = xlsx.readFile(fullPath);
    const sheet = workbook.Sheets[source.sheet];
    const csv = xlsx.utils.sheet_to_csv(sheet);
    const result = await uploadCsvToEdge(source.file, source.priority, csv);
    console.log(source.file, result);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
