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
  const [hideOrphans, setHideOrphans] = useState(false);

  const employeeOptions = useMemo(() => 
    allEmployees.map(e => ({
      id: e.id,
      label: e.nombre + (e.area ? ` (${e.area})` : "")
    })).sort((a, b) => a.label.localeCompare(b.label)),
    [allEmployees]
  );

  const filteredNodes = useMemo(() => {
    if (!hideOrphans) return nodes;

    // Un suelto es alguien sin manager Y que no es manager de nadie más
    return nodes.filter(node => {
      const hasManager = !!node.manager_id;
      const isManager = nodes.some(n => n.manager_id === node.employee_id);
      return hasManager || isManager;
    });
  }, [nodes, hideOrphans]);

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
    <div className="page-container chart-view">
      <div className="controls-bar sticky-sub">
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

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '0.8rem', 
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input 
              type="checkbox" 
              checked={hideOrphans} 
              onChange={(e) => setHideOrphans(e.target.checked)}
              style={{ width: 'auto' }}
            />
            Ocultar sueltos
          </label>
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
      </div>

      <main className="chart-main" style={{ background: viewMode === 'classic' ? '#f8fafc' : 'white' }}>
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
                nodes={filteredNodes} 
                onSelectEmployee={(id) => setRootId(id)} 
                onEditEmployee={(emp) => setSelectedEmployeeForEdit(emp)}
              />
            ) : (
              <OrgClassic 
                nodes={filteredNodes} 
                onSelectEmployee={(id) => setRootId(id)} 
                onEditEmployee={(emp) => setSelectedEmployeeForEdit(emp)}
              />
            )}
          </>
        )}
      </main>

      <EmployeeEditor 
        employee={selectedEmployeeForEdit}
        onClose={() => setSelectedEmployeeForEdit(null)}
        onSave={() => void loadChart()}
      />
    </div>
  );
}
