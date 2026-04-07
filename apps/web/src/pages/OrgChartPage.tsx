import { useEffect, useMemo, useState } from "react";
import { getOrgchart, searchEmployees } from "../lib/api";
import type { OrgNode, EmployeeDirectoryRow } from "../types/orgchart";
import { OrgFlow } from "../components/OrgFlow";
import { OrgClassic } from "../components/OrgClassic";
import { EmployeeEditor } from "../components/EmployeeEditor";
import { FiSearch, FiGrid, FiShare2 } from "react-icons/fi";

export function OrgChartPage() {
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [rootId, setRootId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [viewMode, setViewMode] = useState<'flow' | 'classic'>('flow');
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<OrgNode | null>(null);

  const employeeOptions = useMemo(() => 
    allEmployees.map(e => ({
      id: e.id,
      label: e.nombre + (e.area ? ` (${e.area})` : "")
    })).sort((a, b) => a.label.localeCompare(b.label)),
    [allEmployees]
  );

  async function loadData() {
    try {
      const emps = await searchEmployees("");
      setAllEmployees(emps);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadChart() {
    setLoading(true);
    try {
      setNodes(await getOrgchart(rootId || null, 8, null));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);
  useEffect(() => { void loadChart(); }, [rootId]);

  return (
    <div className="app-shell" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1>ORGANIGRAMA TARANTO</h1>
          
          <div className="view-toggle">
            <button 
              className={viewMode === 'flow' ? 'active' : ''} 
              onClick={() => setViewMode('flow')}
            >
              <FiShare2 size={14} /> Interactivo
            </button>
            <button 
              className={viewMode === 'classic' ? 'active' : ''} 
              onClick={() => setViewMode('classic')}
            >
              <FiGrid size={14} /> Clásico
            </button>
          </div>
        </div>

        <div style={{ width: '400px' }}>
          <select 
            className="filter-select"
            value={rootId} 
            onChange={(e) => setRootId(e.target.value)}
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '0.85rem'
            }}
          >
            <option value="" style={{ color: 'black' }}>Filtrar por persona (Empresa completa)</option>
            {employeeOptions.map((e) => (
              <option key={e.id} value={e.id} style={{ color: 'black' }}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main style={{ flex: 1, overflow: 'auto', background: viewMode === 'classic' ? '#f8fafc' : 'white' }}>
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="loading-container" style={{ padding: '4rem' }}>
            <div className="loader"></div>
            Cargando Organigrama...
          </div>
        ) : (
          <>
            {viewMode === 'flow' ? (
              <OrgFlow 
                nodes={nodes} 
                onSelectEmployee={(id) => setRootId(id)} 
                onEditEmployee={(emp) => setSelectedEmployeeForEdit(emp)}
              />
            ) : (
              <OrgClassic 
                nodes={nodes} 
                onSelectEmployee={(id) => setRootId(id)} 
                onEditEmployee={(emp) => setSelectedEmployeeForEdit(emp)}
              />
            )}
          </>
        )}

        <EmployeeEditor 
          employee={selectedEmployeeForEdit}
          onClose={() => setSelectedEmployeeForEdit(null)}
          onSave={loadChart}
        />
      </main>
    </div>
  );
}
