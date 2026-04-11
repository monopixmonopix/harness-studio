import type { Edge, Node } from '@xyflow/react';
import {
  type EdgeType,
  type DagNodeData,
  DISPATCH_EDGE_STYLE,
  REPORT_EDGE_STYLE,
  SYNC_EDGE_STYLE,
  ROUNDTRIP_EDGE_STYLE,
} from './workflow-to-flow';

const EDGE_TYPE_CYCLE: readonly EdgeType[] = ['dispatch', 'report', 'sync', 'roundtrip'] as const;

export function nextEdgeType(current: EdgeType): EdgeType {
  const idx = EDGE_TYPE_CYCLE.indexOf(current);
  return EDGE_TYPE_CYCLE[(idx + 1) % EDGE_TYPE_CYCLE.length];
}

export function edgeStyle(type: EdgeType) {
  if (type === 'report') return REPORT_EDGE_STYLE;
  if (type === 'sync') return SYNC_EDGE_STYLE;
  if (type === 'roundtrip') return ROUNDTRIP_EDGE_STYLE;
  return DISPATCH_EDGE_STYLE;
}

export function edgeLabel(type: EdgeType): string | undefined {
  if (type === 'report') return 'report';
  if (type === 'sync') return 'sync';
  if (type === 'roundtrip') return 'roundtrip';
  return undefined;
}

export function edgeMarkers(type: EdgeType): { markerStart?: string; markerEnd?: string } {
  if (type === 'roundtrip') return { markerStart: 'arrowclosed', markerEnd: 'arrowclosed' };
  return {};
}

export function generateNodeId(agentName: string, existingIds: ReadonlySet<string>): string {
  const baseId = agentName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!existingIds.has(baseId)) return baseId;

  let counter = 2;
  while (existingIds.has(`${baseId}-${counter}`)) {
    counter += 1;
  }
  return `${baseId}-${counter}`;
}

/**
 * Returns true if adding a dispatch edge source->target would create a cycle
 * among existing dispatch edges.
 */
export function wouldCreateDispatchCycle(
  source: string,
  target: string,
  edges: readonly Edge[],
): boolean {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const type = e.data?.edgeType ?? 'dispatch';
    if (type === 'dispatch' || type === 'roundtrip') {
      const sources = adj.get(e.source) ?? [];
      adj.set(e.source, [...sources, e.target]);
    }
  }
  const fromTarget = adj.get(source) ?? [];
  adj.set(source, [...fromTarget, target]);

  const visited = new Set<string>();
  const queue = [target];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === source) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of adj.get(current) ?? []) {
      queue.push(next);
    }
  }
  return false;
}

/**
 * Compute the correct sourceHandle and targetHandle for a sync edge
 * based on the relative horizontal positions of source and target nodes.
 */
export function syncHandles(
  sourceId: string,
  targetId: string,
  nodes: readonly Node<DagNodeData>[],
): { readonly sourceHandle: string; readonly targetHandle: string } {
  const sourceNode = nodes.find((n) => n.id === sourceId);
  const targetNode = nodes.find((n) => n.id === targetId);
  const sourceX = sourceNode?.position.x ?? 0;
  const targetX = targetNode?.position.x ?? 0;
  const sourceIsLeft = sourceX <= targetX;
  return {
    sourceHandle: sourceIsLeft ? 'right' : 'left-out',
    targetHandle: sourceIsLeft ? 'left' : 'right-in',
  };
}

/**
 * Update sourceHandle/targetHandle on all sync edges to reflect
 * current node positions. Returns a new array (immutable).
 */
export function fixSyncEdgeHandles(
  edges: readonly Edge[],
  nodes: readonly Node<DagNodeData>[],
): Edge[] {
  return edges.map((edge) => {
    if (edge.data?.edgeType !== 'sync') return edge;
    const handles = syncHandles(edge.source, edge.target, nodes);
    return {
      ...edge,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
    };
  });
}
