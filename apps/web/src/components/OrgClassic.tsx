import type { OrgNode } from "../types/orgchart";
import { FiMail, FiEdit2 } from "react-icons/fi";

interface Props {
  nodes: OrgNode[];
  onSelectEmployee?: (id: string) => void;
  onEditEmployee?: (employee: OrgNode) => void;
}

export function OrgClassic({ nodes, onSelectEmployee, onEditEmployee }: Props) {
  if (!nodes || nodes.length === 0) return null;

  // Agrupar por nivel
  const levels = Array.from(new Set(nodes.map((n) => n.level))).sort((a, b) => a - b);
  const nodesByLevel: Record<number, OrgNode[]> = {};
  levels.forEach((l) => (nodesByLevel[l] = nodes.filter((n) => n.level === l)));

  return (
    <div className="classic-grid fade-in">
      {levels.map((level) => (
        <div key={level} className="level-section">
          <div className="level-badge">
            Nivel {level}
          </div>
          <div className="level-nodes">
            {nodesByLevel[level].map((n) => (
              <div 
                key={n.employee_id} 
                className="classic-card"
                onClick={() => onSelectEmployee?.(n.employee_id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="card-name">{n.nombre}</div>
                    <div className="card-cargo">{n.cargo || "Sin cargo"}</div>
                  </div>
                  <button 
                    className="edit-btn-mini"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEmployee?.(n);
                    }}
                  >
                    <FiEdit2 size={12} />
                  </button>
                </div>
                
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-area">{n.area || "Sin área"}</div>
                  {n.email && (
                    <div title={n.email} style={{ color: '#94a3b8' }}>
                      <FiMail size={14} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
