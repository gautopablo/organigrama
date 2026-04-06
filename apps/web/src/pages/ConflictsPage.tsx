import { useEffect, useState } from "react";
import { listConflicts, resolveConflict } from "../lib/api";
import type { ConflictRow } from "../types/orgchart";

export function ConflictsPage() {
  const [rows, setRows] = useState<ConflictRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await listConflicts("OPEN", null));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onResolve(conflictId: string, action: "ACCEPT_A" | "ACCEPT_B" | "DISCARD") {
    setError("");
    try {
      await resolveConflict(conflictId, action, {});
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section>
      <h2>Conflictos</h2>
      <p>Cola de revisión de contradicciones detectadas entre fuentes.</p>
      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Employee key</th>
            <th>Tipo</th>
            <th>Fuente A</th>
            <th>Fuente B</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.employee_key}</td>
              <td>{row.conflict_type}</td>
              <td>{row.source_a}</td>
              <td>{row.source_b}</td>
              <td>
                <div className="btn-group">
                  <button type="button" onClick={() => void onResolve(row.id, "ACCEPT_A")}>
                    A
                  </button>
                  <button type="button" onClick={() => void onResolve(row.id, "ACCEPT_B")}>
                    B
                  </button>
                  <button type="button" onClick={() => void onResolve(row.id, "DISCARD")}>
                    Descartar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
