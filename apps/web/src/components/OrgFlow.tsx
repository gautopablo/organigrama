import * as dagre from "dagre";
import { useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { OrgNode } from "../types/orgchart";
import { FiEdit2 } from "react-icons/fi";

type EmployeeNodeData = {
  label: string;
  cargo: string;
  area: string;
  email: string;
  onSelect: () => void;
  onEdit: () => void;
};

// Tarjeta personalizada para cada empleado
function EmployeeNode({ data }: NodeProps<Node<EmployeeNodeData>>) {
  return (
    <div className="graph-node" style={{ margin: 0, border: '1px solid #e2e8f0', minWidth: '220px', cursor: 'grab', position: 'relative' }}>
      <Handle type="target" position={Position.Top} style={{ background: '#3b82f6', width: '8px', height: '8px' }} />
      
      <button 
        style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onEdit();
        }}
        title="Editar"
      >
        <FiEdit2 size={14} />
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '20px' }}>
        <strong>{data.label}</strong>
      </div>
      <small>{data.cargo || "Sin cargo"}</small>
      <div style={{ color: '#0369a1', fontSize: '11px', fontWeight: 600 }}>{data.area || "Sin área"}</div>
      {data.email && (
        <small style={{ color: '#64748b', fontSize: '10px', marginTop: '4px', wordBreak: 'break-all', display: 'block' }}>
          {data.email}
        </small>
      )}
      <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem' }}>
        <button 
          className="secondary" 
          style={{ padding: '2px 6px', fontSize: '10px', flex: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            data.onSelect();
          }}
        >
          Ver Rama
        </button>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#3b82f6', width: '8px', height: '8px' }} />
    </div>
  );
}

const nodeTypes = {
  employee: EmployeeNode,
};

interface Props {
  nodes: OrgNode[];
  onSelectEmployee?: (id: string) => void;
  onEditEmployee?: (employee: OrgNode) => void;
}

const nodeWidth = 250;
const nodeHeight = 150;

/**
 * Dagre layout engine helper
 */
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ 
    rankdir: 'TB', 
    nodesep: 150, // Más espacio horizontal
    ranksep: 200  // Más espacio vertical
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

export function OrgFlow({ nodes, onSelectEmployee, onEditEmployee }: Props) {
  const layouted = useMemo(() => {
    if (!nodes || nodes.length === 0) return { nodes: [], edges: [] };

    const rawNodes: Node[] = nodes.map((n) => ({
      id: n.employee_id,
      type: 'employee',
      position: { x: 0, y: 0 },
      data: { 
        label: n.nombre, 
        cargo: n.cargo, 
        area: n.area, 
        email: n.email,
        onSelect: () => onSelectEmployee?.(n.employee_id),
        onEdit: () => onEditEmployee?.(n)
      },
    }));

    const rawEdges: Edge[] = [];
    nodes.forEach((n) => {
      if (n.manager_id && nodes.some(m => m.employee_id === n.manager_id)) {
        rawEdges.push({
          id: `e-${n.manager_id}-${n.employee_id}`,
          source: n.manager_id,
          target: n.employee_id,
          type: 'smoothstep',
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        });
      }
    });

    return getLayoutedElements(rawNodes, rawEdges);
  }, [nodes, onSelectEmployee, onEditEmployee]);

  const flowNodes = layouted.nodes;
  const flowEdges = layouted.edges;

  if (!nodes || nodes.length === 0) {
    return (
      <div className="empty-state">
        <h3>No se encontraron resultados</h3>
        <p>Selecciona un colaborador para ver su árbol jerárquico.</p>
      </div>
    );
  }

  return (
    <div className="graph-wrap" style={{ height: '700px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap zoomable pannable nodeColor="#3b82f6" />
      </ReactFlow>
    </div>
  );
}
