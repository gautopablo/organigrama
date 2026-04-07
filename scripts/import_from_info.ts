import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import xlsx from "xlsx";
import { createClient, FunctionsHttpError } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

const sourceFiles = [
  { file: "usuarios_superiores_organigrama_oficial.xlsx", priority: 1, sheet: "UsuariosSuperiores" }
];

async function uploadCsvToEdge(fileName: string, priority: number, csv: string) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const form = new FormData();
    form.append("source_priority", String(priority));
    form.append("file", new File([csv], fileName.replace(".xlsx", ".csv"), { type: "text/csv" }));

    const { data, error } = await supabase.functions.invoke("upload-source", { body: form });
    if (!error) return data;

    if (error instanceof FunctionsHttpError) {
      const cloned = error.context.clone();
      let payload = "";
      try {
        const body = await error.context.json();
        payload = JSON.stringify(body);
      } catch {
        payload = await cloned.text();
      }
      lastError = new Error(`${fileName}: ${payload}`);
      break;
    }

    lastError = error;
    await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
  }

  throw lastError;
}

function splitCsvInChunks(csv: string, chunkSize = 25): string[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length <= 1) return [];
  const header = lines[0];
  const rows = lines.slice(1);
  const chunks: string[] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const part = rows.slice(i, i + chunkSize);
    chunks.push([header, ...part].join("\n"));
  }
  return chunks;
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
    const chunks = splitCsvInChunks(csv, 20);
    let processed = 0;
    for (let i = 0; i < chunks.length; i += 1) {
      const result = await uploadCsvToEdge(source.file, source.priority, chunks[i]);
      processed += Number(result?.rows ?? 0);
      console.log(`${source.file} chunk ${i + 1}/${chunks.length}`, result);
    }
    console.log(`${source.file}: total procesado ${processed}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
