import * as dagre from "dagre";
import { useMemo, useState } from "react";
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
import { FiEdit2, FiChevronDown, FiChevronUp } from "react-icons/fi";

type EmployeeNodeData = {
  label: string;
  cargo: string;
  area: string;
  email: string;
  hasChildren: boolean;
  isCollapsed: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onToggleCollapse: () => void;
};

// Tarjeta personalizada para cada empleado
function EmployeeNode({ data }: NodeProps<Node<EmployeeNodeData>>) {
  return (
    <div className="graph-node" style={{ margin: 0, border: '1px solid #e2e8f0', minWidth: '220px', cursor: 'grab', position: 'relative' }}>
      <Handle type="target" position={Position.Top} style={{ background: '#3b82f6', width: '8px', height: '8px' }} />
      
      <button 
        className="nodrag nopan"
        type="button"
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
      <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button 
          className="secondary nodrag nopan" 
          type="button"
          style={{ padding: '2px 6px', fontSize: '10px', flex: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            data.onSelect();
          }}
        >
          Ver Rama
        </button>
        {data.hasChildren && (
          <button
            className="nodrag nopan"
            type="button"
            style={{ 
              background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', 
              cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleCollapse();
            }}
            title={data.isCollapsed ? "Expandir rama" : "Colapsar rama"}
          >
            {data.isCollapsed ? <FiChevronDown size={14} /> : <FiChevronUp size={14} />}
          </button>
        )}
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
    nodesep: 75, // Ajustado a la mitad
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
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const handleToggleCollapse = (id: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const layouted = useMemo(() => {
    if (!nodes || nodes.length === 0) return { nodes: [], edges: [] };

    const visibleNodesIds = new Set<string>();
    
    const traverse = (nodeId: string) => {
      visibleNodesIds.add(nodeId);
      if (!collapsedNodes.has(nodeId)) {
        const children = nodes.filter(n => n.manager_id === nodeId);
        children.forEach(c => traverse(c.employee_id));
      }
    };

    const roots = nodes.filter(n => !n.manager_id || !nodes.some(m => m.employee_id === n.manager_id));
    roots.forEach(r => traverse(r.employee_id));

    const visibleNodesList = nodes.filter(n => visibleNodesIds.has(n.employee_id));

    const rawNodes: Node[] = visibleNodesList.map((n) => {
      const children = nodes.filter(child => child.manager_id === n.employee_id);
      return {
        id: n.employee_id,
        type: 'employee',
        position: { x: 0, y: 0 },
        data: { 
          label: n.nombre, 
          cargo: n.cargo, 
          area: n.area, 
          email: n.email,
          hasChildren: children.length > 0,
          isCollapsed: collapsedNodes.has(n.employee_id),
          onSelect: () => onSelectEmployee?.(n.employee_id),
          onEdit: () => onEditEmployee?.(n),
          onToggleCollapse: () => handleToggleCollapse(n.employee_id)
        },
      };
    });

    const rawEdges: Edge[] = [];
    visibleNodesList.forEach((n) => {
      if (n.manager_id && visibleNodesIds.has(n.manager_id)) {
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
