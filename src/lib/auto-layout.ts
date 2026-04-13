import type { Node, Edge } from '@xyflow/react';
import type { DagNodeData } from './workflow-to-flow';
import { computeLevelsFromDepsMap } from './topology';

const HORIZONTAL_SPACING = 320;
const VERTICAL_SPACING = 200;

/**
 * Computes dependency levels from edges using shared topology algorithm.
 * Returns a Map from nodeId to level number.
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

  const levelArrays = computeLevelsFromDepsMap(nodeIds, depsMap);
  const levels = new Map<string, number>();
  for (let i = 0; i < levelArrays.length; i++) {
    for (const id of levelArrays[i]) {
      levels.set(id, i);
    }
  }
  return levels;
}

/**
 * Builds a communication adjacency map from ALL edge types.
 * Two nodes are "communicating" if connected by any edge (sync, report,
 * dispatch, roundtrip). Used to group related nodes closer together
 * within the same level.
 */
function buildCommunicationMap(edges: readonly Edge[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();

  const ensureSet = (id: string): Set<string> => {
    const existing = adjacency.get(id);
    if (existing) return existing;
    const fresh = new Set<string>();
    adjacency.set(id, fresh);
    return fresh;
  };

  for (const edge of edges) {
    ensureSet(edge.source).add(edge.target);
    ensureSet(edge.target).add(edge.source);
  }

  return adjacency;
}

/**
 * Builds a map of parent -> children from dispatch/roundtrip edges.
 * Siblings (nodes sharing a parent) should be grouped together.
 */
function buildSiblingGroups(edges: readonly Edge[]): Map<string, readonly string[]> {
  const parentChildren = new Map<string, string[]>();
  for (const edge of edges) {
    const type = edge.data?.edgeType ?? 'dispatch';
    if (type === 'dispatch' || type === 'roundtrip') {
      const children = parentChildren.get(edge.source) ?? [];
      parentChildren.set(edge.source, [...children, edge.target]);
    }
  }
  return parentChildren;
}

/**
 * Order nodes within a level for communication affinity.
 *
 * Strategy:
 * 1. Group siblings (nodes sharing a common parent) together
 * 2. Within sibling groups, sort by cross-level communication affinity
 * 3. Non-sibling nodes with communication links to same-level nodes are
 *    placed adjacent to their communication partners
 */
function orderByAffinity(
  nodeIds: readonly string[],
  commMap: Map<string, Set<string>>,
  siblingGroups: Map<string, readonly string[]>,
  nodePositionIndex: Map<string, number>,
): readonly string[] {
  if (nodeIds.length <= 1) return nodeIds;

  const nodeSet = new Set(nodeIds);

  // Step 1: Find sibling clusters at this level
  const assigned = new Set<string>();
  const clusters: string[][] = [];

  // Group by shared parent — siblings stay together
  for (const [, children] of siblingGroups) {
    const sameLevelSiblings = children.filter((c) => nodeSet.has(c) && !assigned.has(c));
    if (sameLevelSiblings.length > 1) {
      clusters.push(sameLevelSiblings);
      for (const id of sameLevelSiblings) {
        assigned.add(id);
      }
    }
  }

  // Step 2: Group remaining nodes by same-level communication links
  for (const id of nodeIds) {
    if (assigned.has(id)) continue;
    const sameLevelPeers = [...(commMap.get(id) ?? [])].filter(
      (p) => nodeSet.has(p) && !assigned.has(p)
    );
    if (sameLevelPeers.length > 0) {
      const cluster = [id, ...sameLevelPeers];
      clusters.push(cluster);
      for (const cid of cluster) {
        assigned.add(cid);
      }
    }
  }

  // Step 3: Remaining isolated nodes
  const isolated = nodeIds.filter((id) => !assigned.has(id));

  // Compute cross-level attraction for positioning clusters
  const attractionPos = (id: string): number | null => {
    const crossLevelPeers = [...(commMap.get(id) ?? [])].filter(
      (p) => !nodeSet.has(p) && nodePositionIndex.has(p)
    );
    if (crossLevelPeers.length === 0) return null;
    const sum = crossLevelPeers.reduce((acc, p) => acc + (nodePositionIndex.get(p) ?? 0), 0);
    return sum / crossLevelPeers.length;
  };

  const clusterAttraction = (ids: readonly string[]): number | null => {
    const positions = ids.map(attractionPos).filter((p): p is number => p !== null);
    if (positions.length === 0) return null;
    return positions.reduce((a, b) => a + b, 0) / positions.length;
  };

  type PlacementItem = { readonly ids: readonly string[]; readonly attraction: number | null };

  const items: PlacementItem[] = [
    ...clusters.map((c) => ({ ids: c as readonly string[], attraction: clusterAttraction(c) })),
    ...isolated.map((id) => ({ ids: [id] as readonly string[], attraction: attractionPos(id) })),
  ];

  // Sort: items with cross-level attraction first (by position), rest after
  const withAttraction = items
    .filter((it): it is PlacementItem & { attraction: number } => it.attraction !== null)
    .sort((a, b) => a.attraction - b.attraction);
  const withoutAttraction = items.filter((it) => it.attraction === null);

  return [...withAttraction, ...withoutAttraction].flatMap((item) => item.ids);
}

/**
 * Returns new nodes with positions recalculated using dependency-based
 * level layout. Sticky notes are left at their current positions.
 *
 * Layout priorities:
 * 1. Dependency hierarchy determines vertical levels (dispatch/roundtrip edges)
 * 2. Communicating agents are placed close together within the same level
 *    (all edge types: sync, report, dispatch, roundtrip + sibling affinity)
 */
export function autoLayoutNodes(
  nodes: readonly Node<DagNodeData>[],
  edges: readonly Edge[],
): Node<DagNodeData>[] {
  const dagNodes = nodes.filter((n) => n.type !== 'stickyNote');
  const stickyNodes = nodes.filter((n) => n.type === 'stickyNote');

  const levels = computeLevelsFromEdges(dagNodes, edges);
  const commMap = buildCommunicationMap(edges);
  const siblingGroups = buildSiblingGroups(edges);

  // Group nodes by level
  const levelGroups = new Map<number, Node<DagNodeData>[]>();
  for (const node of dagNodes) {
    const level = levels.get(node.id) ?? 0;
    const group = levelGroups.get(level) ?? [];
    levelGroups.set(level, [...group, node]);
  }

  // Order each level's nodes by affinity, processing top-down
  const orderedLevelIds = new Map<number, readonly string[]>();
  const nodePositionIndex = new Map<string, number>();
  const maxLevel = Math.max(...Array.from(levels.values()), 0);

  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const group = levelGroups.get(lvl) ?? [];
    const ids = group.map((n) => n.id);
    const ordered = orderByAffinity(ids, commMap, siblingGroups, nodePositionIndex);
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
