import { useEffect, useMemo, useState } from "react";
import { getOrgchart, updateManager } from "../lib/api";
import type { OrgNode } from "../types/orgchart";
import { OrgGraph } from "../components/OrgGraph";

export function OrgChartPage() {
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [newManagerId, setNewManagerId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const employeeOptions = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.employee_id,
        label: `${n.nombre} (${n.area ?? "Sin área"})`
      })),
    [nodes]
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      setNodes(await getOrgchart(null, 6, null));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onUpdateManager() {
    if (!selectedId) return;
    setError("");
    try {
      await updateManager(selectedId, newManagerId || null);
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
      <h2>Vista Organigrama</h2>
      <p>Visualización jerárquica con edición de relación “reporta a”.</p>
      <div className="panel">
        <label>
          Empleado
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Seleccionar</option>
            {employeeOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nuevo superior
          <select value={newManagerId} onChange={(e) => setNewManagerId(e.target.value)}>
            <option value="">Sin superior</option>
            {employeeOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => void onUpdateManager()}>
          Actualizar relación
        </button>
      </div>
      {loading && <p>Cargando organigrama...</p>}
      {error && <p className="error">{error}</p>}
      <OrgGraph nodes={nodes} onSelectEmployee={setSelectedId} />
    </section>
  );
}
