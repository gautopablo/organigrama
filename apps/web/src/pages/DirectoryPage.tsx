import { useEffect, useState } from "react";
import { searchEmployees } from "../lib/api";
import type { EmployeeDirectoryRow } from "../types/orgchart";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { EmployeeEditor } from "../components/EmployeeEditor";
import { FiEdit2 } from "react-icons/fi";
import type { OrgNode } from "../types/orgchart";

export function DirectoryPage() {
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [rows, setRows] = useState<EmployeeDirectoryRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<OrgNode | null>(null);

  const filteredRows = rows.filter(r => {
    const matchArea = !areaFilter || (r.area && r.area.toLowerCase().includes(areaFilter.toLowerCase()));
    const matchDivision = !divisionFilter || (r.division && r.division.toLowerCase().includes(divisionFilter.toLowerCase()));
    const matchManager = !managerFilter || (r.manager_name && r.manager_name.toLowerCase().includes(managerFilter.toLowerCase()));
    return matchArea && matchDivision && matchManager;
  });

  const handleExport = () => {
    if (filteredRows.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const headers = ["Legajo", "Nombre", "Email", "Cargo", "Área", "División", "Reporta a", "Confianza", "Origen"];
    
    const csvContent = [
      headers.join(","),
      ...filteredRows.map(r => {
        const row = [
          r.legajo || "",
          r.nombre,
          r.email || "",
          r.cargo || "",
          r.area || "",
          r.division || "",
          r.manager_name || "",
          r.confidence || "",
          r.source || ""
        ];
        // Enclose in quotes to handle inner commas
        return row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
      })
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `directorio_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await searchEmployees(query));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="content-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Directorio</h2>
        <button onClick={handleExport} className="secondary" disabled={filteredRows.length === 0}>
          Exportar CSV
        </button>
      </div>
      <div className="panel">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 250px' }}>
            <label>Búsqueda general</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="search"
                value={query}
                placeholder="Buscar (presiona Enter)"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void load()}
              />
              <button type="button" onClick={() => void load()}>Buscar</button>
            </div>
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Área</label>
            <input
              type="search"
              value={areaFilter}
              placeholder="Filtrar por área..."
              onChange={(e) => setAreaFilter(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>División</label>
            <input
              type="search"
              value={divisionFilter}
              placeholder="Filtrar por división..."
              onChange={(e) => setDivisionFilter(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Reporta a</label>
            <input
              type="search"
              value={managerFilter}
              placeholder="Filtrar por manager..."
              onChange={(e) => setManagerFilter(e.target.value)}
            />
          </div>
        </div>
      </div>
      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Cargo</th>
            <th>Área</th>
            <th>División</th>
            <th>Reporta a</th>
            <th>Confianza</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((r) => (
            <tr key={r.id}>
              <td>{r.nombre}</td>
              <td>{r.email ?? "-"}</td>
              <td>{r.cargo ?? "-"}</td>
              <td>{r.area ?? "-"}</td>
              <td>{r.division ?? "-"}</td>
              <td>{r.manager_name ?? "-"}</td>
              <td>
                <ConfidenceBadge confidence={r.confidence} />
              </td>
              <td>
                <button 
                  className="icon-btn" 
                  onClick={() => setSelectedForEdit({
                    employee_id: r.id,
                    nombre: r.nombre,
                    email: r.email,
                    cargo: r.cargo,
                    area: r.area,
                    division: r.division,
                    manager_id: r.manager_id,
                    level: 0,
                    confidence: r.confidence,
                    source: r.source
                  })}
                >
                  <FiEdit2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <EmployeeEditor 
        employee={selectedForEdit}
        onClose={() => setSelectedForEdit(null)}
        onSave={() => void load()}
      />
    </section>
  );
}
