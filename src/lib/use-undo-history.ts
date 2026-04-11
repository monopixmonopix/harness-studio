import { useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface HistoryEntry {
  readonly nodes: readonly Node[];
  readonly edges: readonly Edge[];
}

const MAX_HISTORY = 50;

interface UndoRedoActions {
  /** Snapshot current state before a mutation. */
  readonly pushSnapshot: (nodes: readonly Node[], edges: readonly Edge[]) => void;
  /** Undo: pass current nodes/edges, get back the previous state (or null). */
  readonly performUndo: (
    currentNodes: readonly Node[],
    currentEdges: readonly Edge[],
  ) => HistoryEntry | null;
  /** Redo: pass current nodes/edges, get back the next state (or null). */
  readonly performRedo: (
    currentNodes: readonly Node[],
    currentEdges: readonly Edge[],
  ) => HistoryEntry | null;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

function cloneEntry(nodes: readonly Node[], edges: readonly Edge[]): HistoryEntry {
  return {
    nodes: nodes.map((n) => ({
      ...n,
      data: { ...n.data },
      position: { ...n.position },
    })),
    edges: edges.map((e) => ({
      ...e,
      data: e.data ? { ...e.data } : undefined,
    })),
  };
}

export function useUndoRedo(): UndoRedoActions {
  const pastRef = useRef<HistoryEntry[]>([]);
  const futureRef = useRef<HistoryEntry[]>([]);

  const pushSnapshot = useCallback(
    (nodes: readonly Node[], edges: readonly Edge[]) => {
      const entry = cloneEntry(nodes, edges);
      pastRef.current = [...pastRef.current, entry].slice(-MAX_HISTORY);
      futureRef.current = [];
    },
    [],
  );

  const performUndo = useCallback(
    (
      currentNodes: readonly Node[],
      currentEdges: readonly Edge[],
    ): HistoryEntry | null => {
      if (pastRef.current.length === 0) return null;
      const previous = pastRef.current[pastRef.current.length - 1];
      pastRef.current = pastRef.current.slice(0, -1);
      futureRef.current = [
        ...futureRef.current,
        cloneEntry(currentNodes, currentEdges),
      ];
      return previous;
    },
    [],
  );

  const performRedo = useCallback(
    (
      currentNodes: readonly Node[],
      currentEdges: readonly Edge[],
    ): HistoryEntry | null => {
      if (futureRef.current.length === 0) return null;
      const next = futureRef.current[futureRef.current.length - 1];
      futureRef.current = futureRef.current.slice(0, -1);
      pastRef.current = [
        ...pastRef.current,
        cloneEntry(currentNodes, currentEdges),
      ];
      return next;
    },
    [],
  );

  return {
    pushSnapshot,
    performUndo,
    performRedo,
    get canUndo() {
      return pastRef.current.length > 0;
    },
    get canRedo() {
      return futureRef.current.length > 0;
    },
  };
}
