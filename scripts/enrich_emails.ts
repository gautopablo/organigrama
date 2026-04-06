import fs from "node:fs";
import path from "node:path";

type Employee = {
  nombre: string; legajo: string; email: string; cargo: string; area: string;
  manager_nombre: string; manager_legajo: string; manager_email: string;
  fuente: string;
};
const employees: Employee[] = JSON.parse(fs.readFileSync(path.resolve("data_local.json"), "utf8"));

// Parsear CSV usuarios
const csvText = fs.readFileSync(path.resolve("info/exportUsers_2026-3-19.csv"), "utf8");
const lines = csvText.split(/\r?\n/).filter(l => l.trim());

type UserRow = { displayName: string; email: string };
const users: UserRow[] = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.includes("@taranto.com.ar")) continue;

  const afterFirstComma = line.indexOf(",") + 1;
  let displayName = "", email = "";

  if (line[afterFirstComma] === '"') {
    const closingQuote = line.indexOf('"', afterFirstComma + 1);
    displayName = line.substring(afterFirstComma + 1, closingQuote);
    const rest = line.substring(closingQuote + 2);
    email = rest.split(",")[0];
  } else {
    const parts = line.split(",");
    displayName = parts[1];
    email = parts[2];
  }

  if (email && email.includes("@taranto.com.ar")) {
    users.push({ displayName: displayName.trim(), email: email.trim().toLowerCase() });
  }
}

console.log(`Usuarios @taranto.com.ar: ${users.length}`);

// Normalizar: quitar acentos, lowercase, solo letras
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s,]/g, "").replace(/\s+/g, " ").trim();
}

// Generar claves de match: "apellido" y "apellido, primer_nombre"
function matchKeys(nombre: string): string[] {
  const n = norm(nombre);
  const keys: string[] = [n]; // exact

  // Si formato "Apellido, Nombre Segundo" → extraer "apellido, nombre"
  if (n.includes(",")) {
    const [apellido, nombres] = n.split(",").map(s => s.trim());
    const primerNombre = nombres.split(" ")[0];
    keys.push(`${apellido}, ${primerNombre}`);
    keys.push(apellido); // solo apellido como último recurso
  }

  // Si formato "Apellido1 Apellido2, Nombre" → "apellido1, nombre"
  if (n.includes(",")) {
    const [apellidoPart, nombrePart] = n.split(",").map(s => s.trim());
    const primerApellido = apellidoPart.split(" ")[0];
    const primerNombre = nombrePart.split(" ")[0];
    keys.push(`${primerApellido}, ${primerNombre}`);
  }

  return keys;
}

// Mapa de usuarios por distintas claves
const userByKey = new Map<string, UserRow>();
for (const u of users) {
  for (const k of matchKeys(u.displayName)) {
    if (!userByKey.has(k)) userByKey.set(k, u);
  }
}

// Enriquecer
let emailsAdded = 0;
const noMatch: string[] = [];

for (const emp of employees) {
  if (emp.email) continue;

  const keys = matchKeys(emp.nombre);
  let found: UserRow | undefined;
  for (const k of keys) {
    found = userByKey.get(k);
    if (found) break;
  }

  if (found) {
    emp.email = found.email;
    emailsAdded++;
  } else {
    noMatch.push(emp.nombre);
  }
}

console.log(`Emails completados: ${emailsAdded}`);
console.log(`Total con email: ${employees.filter(e => e.email).length} / ${employees.length}`);
console.log(`Sin match (${noMatch.length}):`);
noMatch.forEach(n => console.log(`  - ${n}`));

fs.writeFileSync(path.resolve("data_local.json"), JSON.stringify(employees, null, 2), "utf8");
console.log("\n✓ data_local.json actualizado");
