import { useEffect, useState } from "react";
import { searchEmployees } from "../lib/api";
import type { EmployeeDirectoryRow } from "../types/orgchart";
import { ConfidenceBadge } from "../components/ConfidenceBadge";

export function DirectoryPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<EmployeeDirectoryRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <section>
      <h2>Directorio</h2>
      <div className="panel">
        <input
          type="search"
          value={query}
          placeholder="Buscar por nombre, email, cargo..."
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" onClick={() => void load()}>
          Buscar
        </button>
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
            <th>Reporta a</th>
            <th>Confianza</th>
            <th>Fuente</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.nombre}</td>
              <td>{r.email ?? "-"}</td>
              <td>{r.cargo ?? "-"}</td>
              <td>{r.area ?? "-"}</td>
              <td>{r.manager_name ?? "-"}</td>
              <td>
                <ConfidenceBadge confidence={r.confidence} />
              </td>
              <td>{r.source ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
