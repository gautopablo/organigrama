import fs from "node:fs";
import path from "node:path";

// --- 1. Leer fuente 1: data_local.json (Excel oficial, 79 empleados) ---
const src1: Array<{
  nombre: string; legajo: string; email: string; cargo: string; area: string;
  manager_nombre: string; manager_legajo: string; manager_email: string;
}> = JSON.parse(fs.readFileSync(path.resolve("data_local.json"), "utf8"));

// --- 2. Leer fuente 2: reporta a.csv (279 empleados) ---
const csvText = fs.readFileSync(path.resolve("info/reporta a.csv"), "utf8");
const csvLines = csvText.split(/\r?\n/).filter(l => l.trim());
const src2 = csvLines.slice(1).map(line => {
  const [legajo, apellido, nombre, reportaA] = line.split(";").map(s => s.trim());
  return { legajo, apellido, nombre, reportaA };
});

// --- Helpers ---
function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function normKey(s: string): string {
  return s.toLowerCase().replace(/[^a-záéíóúñü\s]/g, "").replace(/\s+/g, " ").trim();
}

// --- 3. Armar mapa base con fuente 1 (prioridad alta) ---
type Employee = {
  nombre: string; legajo: string; email: string; cargo: string; area: string;
  manager_nombre: string; manager_legajo: string; manager_email: string;
  fuente: string;
};

const byLegajo = new Map<string, Employee>();
const byNormName = new Map<string, Employee>();

for (const e of src1) {
  const emp: Employee = { ...e, fuente: "excel_oficial" };
  if (e.legajo) byLegajo.set(e.legajo, emp);
  byNormName.set(normKey(e.nombre), emp);
}

console.log(`Fuente 1 (Excel oficial): ${src1.length} empleados`);

// --- 4. Integrar fuente 2 ---
let matched = 0, added = 0, skipped = 0;

for (const row of src2) {
  if (!row.legajo) { skipped++; continue; }

  const nombreCompleto = `${titleCase(row.apellido)}, ${titleCase(row.nombre)}`;
  const managerNombre = row.reportaA ? titleCase(row.reportaA.replace(/,/g, "").trim()) : "";
  // Invertir "APELLIDO NOMBRE" manager a "Apellido, Nombre"
  const managerParts = (row.reportaA || "").trim().split(/\s+/);
  let managerFormateado = "";
  if (managerParts.length >= 2) {
    const mApellido = titleCase(managerParts[0]);
    const mNombre = titleCase(managerParts.slice(1).join(" "));
    managerFormateado = `${mApellido}, ${mNombre}`;
  } else if (managerParts.length === 1) {
    managerFormateado = titleCase(managerParts[0]);
  }

  const existing = byLegajo.get(row.legajo);
  if (existing) {
    // Ya existe: solo actualizar manager si no tiene
    if (!existing.manager_nombre && managerFormateado) {
      existing.manager_nombre = managerFormateado;
    }
    matched++;
  } else {
    // Nuevo empleado
    const emp: Employee = {
      nombre: nombreCompleto,
      legajo: row.legajo,
      email: "",
      cargo: "",
      area: "",
      manager_nombre: managerFormateado,
      manager_legajo: "",
      manager_email: "",
      fuente: "reporta_a"
    };
    byLegajo.set(row.legajo, emp);
    byNormName.set(normKey(nombreCompleto), emp);
    added++;
  }
}

console.log(`Fuente 2 (Reporta A): ${src2.length} filas → ${matched} matcheados, ${added} nuevos, ${skipped} saltados`);

// --- 5. Exportar ---
const allEmployees = [...byLegajo.values()];
console.log(`\nTotal combinado: ${allEmployees.length} empleados`);

const areas = [...new Set(allEmployees.map(e => e.area).filter(Boolean))];
console.log(`Áreas con dato: ${areas.length}`);
console.log(`Con email: ${allEmployees.filter(e => e.email).length}`);
console.log(`Con cargo: ${allEmployees.filter(e => e.cargo).length}`);
console.log(`Con manager: ${allEmployees.filter(e => e.manager_nombre).length}`);

fs.writeFileSync(path.resolve("data_local.json"), JSON.stringify(allEmployees, null, 2), "utf8");
console.log("\n✓ data_local.json actualizado");
