// Reconstruye data_local.json desde las fuentes originales con matching por legajo
import fs from "node:fs";

// --- Leer CSV reporta a ---
const csv = fs.readFileSync("info/reporta a.csv", "utf8");
const lines = csv.split(/\r?\n/).filter(l => l.trim());
const rows = lines.slice(1).map(l => {
  const [legajo, apellido, nombre, reportaA] = l.split(";").map(s => s.trim());
  return { legajo, apellido, nombre, reportaA };
});

console.log("CSV reporta a:", rows.length, "filas");

// --- Leer Excel oficial (ya convertido) ---
// Regenero desde el json anterior del excel
// Pero primero, genero el mapa de legajo desde el CSV que es la fuente principal

// Clave corta: primer apellido + primer nombre (así funciona "Reporta A")
function shortKey(apellido, nombre) {
  const a = (apellido || "").split(/\s+/)[0].toLowerCase();
  const n = (nombre || "").split(/\s+/)[0].toLowerCase();
  return `${a} ${n}`;
}

function titleCase(s) {
  return (s || "").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// Mapa: clave_corta -> legajo
const shortKeyToLegajo = new Map();
const legajoToRow = new Map();

for (const r of rows) {
  const key = shortKey(r.apellido, r.nombre);
  shortKeyToLegajo.set(key, r.legajo);
  legajoToRow.set(r.legajo, r);
}

console.log("Claves cortas únicas:", shortKeyToLegajo.size);

// Resolver manager_legajo para cada fila
const employees = [];
let managersResolved = 0, managersNotFound = 0;

for (const r of rows) {
  const reportaKey = (r.reportaA || "").toLowerCase();
  let managerLegajo = "";

  if (reportaKey) {
    // "RANEA MAURICIO" → "ranea mauricio" = shortKey
    managerLegajo = shortKeyToLegajo.get(reportaKey) || "";
    if (managerLegajo) {
      managersResolved++;
    } else {
      managersNotFound++;
    }
  }

  const managerRow = managerLegajo ? legajoToRow.get(managerLegajo) : null;

  employees.push({
    nombre: `${titleCase(r.apellido)}, ${titleCase(r.nombre)}`,
    legajo: r.legajo,
    email: "",
    cargo: "",
    area: "",
    manager_nombre: managerRow
      ? `${titleCase(managerRow.apellido)}, ${titleCase(managerRow.nombre)}`
      : (r.reportaA ? titleCase(r.reportaA) : ""),
    manager_legajo: managerLegajo,
    fuente: "reporta_a"
  });
}

console.log("Managers resueltos por legajo:", managersResolved);
console.log("Managers NO encontrados:", managersNotFound);

// --- Enriquecer con Excel oficial (email, cargo, area) ---
// Leemos el excel via el json que ya generamos antes con excel_to_json
// Pero ese json ya fue sobreescrito. Regeneramos rápido desde xlsx
import xlsx from "xlsx";
const wb = xlsx.readFile("info/usuarios_superiores_organigrama_oficial.xlsx");
const ws = wb.Sheets["UsuariosSuperiores"];
const excelRows = xlsx.utils.sheet_to_json(ws);

const excelByLegajo = new Map();
for (const r of excelRows) {
  const leg = String(r["Legajo usuario"] || "").trim();
  if (leg) excelByLegajo.set(leg, r);
}

let enriched = 0;
for (const emp of employees) {
  const ex = excelByLegajo.get(emp.legajo);
  if (ex) {
    emp.email = (ex["Email usuario"] || "").trim().toLowerCase();
    emp.cargo = (ex["Cargo usuario"] || "").trim();
    emp.area = (ex["Área"] || "").trim();
    emp.fuente = "excel_oficial+reporta_a";
    enriched++;
  }
}
console.log("Enriquecidos con Excel oficial:", enriched);

// --- Enriquecer emails con Azure AD export ---
const adCsv = fs.readFileSync("info/exportUsers_2026-3-19.csv", "utf8");
const adLines = adCsv.split(/\r?\n/).filter(l => l.includes("@taranto.com.ar"));

function normName(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s,]/g, "").replace(/\s+/g, " ").trim();
}

const adByShortKey = new Map();
for (const line of adLines) {
  let displayName = "", email = "";
  const afterFirst = line.indexOf(",") + 1;
  if (line[afterFirst] === '"') {
    const close = line.indexOf('"', afterFirst + 1);
    displayName = line.substring(afterFirst + 1, close);
    email = line.substring(close + 2).split(",")[0];
  } else {
    const p = line.split(",");
    displayName = p[1]; email = p[2];
  }
  if (!email || !email.includes("@taranto.com.ar")) continue;
  email = email.trim().toLowerCase();
  
  // Generar short key del AD: "Aciar, Marcelo" -> "aciar marcelo"
  const dn = normName(displayName);
  if (dn.includes(",")) {
    const [ap, no] = dn.split(",").map(s => s.trim());
    adByShortKey.set(`${ap.split(" ")[0]} ${no.split(" ")[0]}`, email);
    adByShortKey.set(dn, email); // full key too
  }
}

let adEmails = 0;
for (const emp of employees) {
  if (emp.email) continue;
  const key = shortKey(
    emp.nombre.includes(",") ? emp.nombre.split(",")[0] : emp.nombre,
    emp.nombre.includes(",") ? emp.nombre.split(",")[1] : ""
  );
  const found = adByShortKey.get(key);
  if (found) { emp.email = found; adEmails++; }
}
console.log("Emails completados desde Azure AD:", adEmails);

// --- Stats ---
console.log("\n=== RESUMEN ===");
console.log("Total empleados:", employees.length);
console.log("Con email:", employees.filter(e => e.email).length);
console.log("Con cargo:", employees.filter(e => e.cargo).length);
console.log("Con área:", employees.filter(e => e.area).length);
console.log("Con manager_legajo:", employees.filter(e => e.manager_legajo).length);

// Verificación Ranea
const raneaLeg = shortKeyToLegajo.get("ranea mauricio");
const reportanARanea = employees.filter(e => e.manager_legajo === raneaLeg);
console.log("\nVerificación RANEA (legajo " + raneaLeg + "): " + reportanARanea.length + " reportes directos");

fs.writeFileSync("data_local.json", JSON.stringify(employees, null, 2), "utf8");
console.log("\n✓ data_local.json generado");
