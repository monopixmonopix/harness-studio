import type { Node, Edge } from '@xyflow/react';
import type { DagNodeData } from './workflow-to-flow';
import { buildSyncMapFromEdges, orderNodesBySyncAffinity } from './workflow-to-flow';

const HORIZONTAL_SPACING = 320;
const VERTICAL_SPACING = 200;

/**
 * Computes dependency levels from edges. Nodes with no incoming
 * dispatch/roundtrip edges are at level 0. Each node's level is
 * max(parent levels) + 1.
 */
function computeLevelsFromEdges(
  nodes: readonly Node<DagNodeData>[],
  edges: readonly Edge[],
): Map<string, number> {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const depsMap = new Map<string, readonly string[]>();

  for (const node of nodes) {
    const deps = edges
      .filter((e) => {
        const type = e.data?.edgeType ?? 'dispatch';
        return e.target === node.id && (type === 'dispatch' || type === 'roundtrip');
      })
      .map((e) => e.source)
      .filter((id) => nodeIds.has(id));
    depsMap.set(node.id, deps);
  }

  const levels = new Map<string, number>();

  function getLevel(id: string): number {
    if (levels.has(id)) return levels.get(id)!;
    const deps = depsMap.get(id) ?? [];
    if (deps.length === 0) {
      levels.set(id, 0);
      return 0;
    }
    const maxParent = Math.max(...deps.map(getLevel));
    const level = maxParent + 1;
    levels.set(id, level);
    return level;
  }

  for (const node of nodes) {
    getLevel(node.id);
  }

  return levels;
}

/**
 * Returns new nodes with positions recalculated using dependency-based
 * level layout. Sticky notes are left at their current positions.
 */
export function autoLayoutNodes(
  nodes: readonly Node<DagNodeData>[],
  edges: readonly Edge[],
): Node<DagNodeData>[] {
  const dagNodes = nodes.filter((n) => n.type !== 'stickyNote');
  const stickyNodes = nodes.filter((n) => n.type === 'stickyNote');

  const levels = computeLevelsFromEdges(dagNodes, edges);
  const syncMap = buildSyncMapFromEdges(edges);

  // Group nodes by level
  const levelGroups = new Map<number, Node<DagNodeData>[]>();
  for (const node of dagNodes) {
    const level = levels.get(node.id) ?? 0;
    const group = levelGroups.get(level) ?? [];
    levelGroups.set(level, [...group, node]);
  }

  // Order each level's nodes for sync affinity, processing top-down
  const orderedLevelIds = new Map<number, readonly string[]>();
  const nodePositionIndex = new Map<string, number>();
  const maxLevel = Math.max(...Array.from(levels.values()), 0);

  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const group = levelGroups.get(lvl) ?? [];
    const ids = group.map((n) => n.id);
    const ordered = orderNodesBySyncAffinity(ids, syncMap, nodePositionIndex);
    orderedLevelIds.set(lvl, ordered);
    for (let i = 0; i < ordered.length; i++) {
      nodePositionIndex.set(ordered[i], i);
    }
  }

  const layouted: Node<DagNodeData>[] = dagNodes.map((node) => {
    const level = levels.get(node.id) ?? 0;
    const ordered = orderedLevelIds.get(level) ?? [node.id];
    const siblingIndex = ordered.indexOf(node.id);
    const totalSiblings = ordered.length;

    return {
      ...node,
      position: {
        x: HORIZONTAL_SPACING * siblingIndex - (HORIZONTAL_SPACING / 2) * (totalSiblings - 1),
        y: VERTICAL_SPACING * level,
      },
    };
  });

  return [...layouted, ...stickyNodes.map((n) => ({ ...n }))];
}
