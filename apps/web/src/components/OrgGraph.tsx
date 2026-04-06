import type { OrgNode } from "../types/orgchart";
import { ConfidenceBadge } from "./ConfidenceBadge";

type Props = {
  nodes: OrgNode[];
  onSelectEmployee?: (id: string) => void;
};

function groupByLevel(nodes: OrgNode[]) {
  return nodes.reduce<Record<number, OrgNode[]>>((acc, node) => {
    if (!acc[node.level]) acc[node.level] = [];
    acc[node.level].push(node);
    return acc;
  }, {});
}

export function OrgGraph({ nodes, onSelectEmployee }: Props) {
  const levels = groupByLevel(nodes);
  const sortedLevels = Object.keys(levels)
    .map(Number)
    .sort((a, b) => a - b);

  if (!nodes.length) return <p>No hay nodos para visualizar.</p>;

  return (
    <div className="graph-wrap">
      {sortedLevels.map((level) => (
        <div key={level} className="graph-level">
          <h3>Nivel {level}</h3>
          <div className="graph-row">
            {levels[level].map((n) => (
              <button
                type="button"
                className="graph-node"
                key={n.employee_id}
                onClick={() => onSelectEmployee?.(n.employee_id)}
              >
                <strong>{n.nombre}</strong>
                <small>{n.cargo ?? "Sin cargo"}</small>
                <small>{n.area ?? "Sin área"}</small>
                <ConfidenceBadge confidence={n.confidence} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
