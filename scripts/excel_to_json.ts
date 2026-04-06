import xlsx from "xlsx";
import fs from "node:fs";
import path from "node:path";

const filePath = path.resolve("info/usuarios_superiores_organigrama_oficial.xlsx");
const wb = xlsx.readFile(filePath);
const ws = wb.Sheets["UsuariosSuperiores"];
const rawRows = xlsx.utils.sheet_to_json<Record<string, string | number>>(ws);

function norm(val: string | number | undefined | null): string {
  return String(val ?? "").trim();
}

const employees: Record<string, {
  nombre: string;
  legajo: string;
  email: string;
  cargo: string;
  area: string;
  manager_nombre: string;
  manager_legajo: string;
  manager_email: string;
}> = {};

for (const row of rawRows) {
  const nombre = norm(row["Usuario (tabla usuarios)"]) || norm(row["Usuario (organigrama)"]);
  const legajo = norm(row["Legajo usuario"]);
  const email = norm(row["Email usuario"]);
  const cargo = norm(row["Cargo usuario"]);
  const area = norm(row["Área"]);
  const managerNombre = norm(row["Superior oficial (normalizado)"]) || norm(row["Superior (tabla usuarios)"]);
  const managerLegajo = norm(row["Legajo superior oficial"]);
  const managerEmail = norm(row["Email superior oficial"]);

  if (!nombre) continue;

  const key = legajo || email.toLowerCase() || nombre.toLowerCase();
  employees[key] = { nombre, legajo, email, cargo, area, manager_nombre: managerNombre, manager_legajo: managerLegajo, manager_email: managerEmail };
}

const list = Object.values(employees);
console.log(`Empleados extraídos: ${list.length}`);
console.log("Ejemplo:", JSON.stringify(list[0], null, 2));
console.log("Ejemplo:", JSON.stringify(list[1], null, 2));

const outPath = path.resolve("data_local.json");
fs.writeFileSync(outPath, JSON.stringify(list, null, 2), "utf8");
console.log(`\nJSON guardado en: ${outPath}`);
