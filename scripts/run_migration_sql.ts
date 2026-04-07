import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const migrationPath = path.resolve("supabase/migrations/20260406_001_init_orgchart.sql");
if (!fs.existsSync(migrationPath)) {
  console.error(`No existe: ${migrationPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, "utf8");

console.log("No se ejecuta SQL automáticamente desde este script.");
console.log("Copiá y ejecutá este archivo en Supabase SQL Editor:");
console.log(migrationPath);
console.log(`\nTamaño SQL: ${sql.length} caracteres`);
