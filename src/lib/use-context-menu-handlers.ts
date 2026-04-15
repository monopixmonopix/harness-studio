'use client';

import { useCallback, useState } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';
import type { DagNodeData } from '@/lib/workflow-to-flow';
import { generateNodeId } from '@/lib/edge-utils';
import { isProtectedNode } from '@/lib/workflow-constants';
import type { ContextMenuState } from '@/components/workflow/CanvasContextMenu';
import type { useUndoRedo } from '@/lib/use-undo-history';

interface AgentOption {
  readonly name: string;
  readonly id: string;
}

interface UseContextMenuHandlersParams {
  readonly nodes: Node<DagNodeData>[];
  readonly edges: Edge[];
  readonly setNodes: (updater: Node<DagNodeData>[] | ((nds: Node<DagNodeData>[]) => Node<DagNodeData>[])) => void;
  readonly setEdges: (updater: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  readonly setDirty: (dirty: boolean) => void;
  readonly undoRedo: ReturnType<typeof useUndoRedo>;
  readonly onNodeSelect: (nodeId: string) => void;
  readonly wrapperRef: React.RefObject<HTMLDivElement | null>;
}

interface UseContextMenuHandlersResult {
  readonly contextMenu: ContextMenuState;
  readonly handlePaneContextMenu: (event: MouseEvent | React.MouseEvent) => void;
  readonly handleNodeContextMenu: (event: React.MouseEvent, node: { id: string; data?: { agent?: string } }) => void;
  readonly handleCloseContextMenu: () => void;
  readonly handleContextAddNode: (agent: AgentOption, position: { readonly x: number; readonly y: number }) => void;
  readonly handleContextAddNote: (position: { readonly x: number; readonly y: number }) => void;
  readonly handleContextEditTask: (nodeId: string) => void;
  readonly handleContextToggleCheckpoint: (nodeId: string) => void;
  readonly handleContextDeleteNode: (nodeId: string) => void;
}

export function useContextMenuHandlers({
  nodes,
  edges,
  setNodes,
  setEdges,
  setDirty,
  undoRedo,
  onNodeSelect,
  wrapperRef,
}: UseContextMenuHandlersParams): UseContextMenuHandlersResult {
  const reactFlowInstance = useReactFlow();
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

  const handlePaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      const bounds = wrapperRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setContextMenu({
        kind: 'canvas',
        position: { x: event.clientX, y: event.clientY },
        flowPosition,
      });
    },
    [reactFlowInstance, wrapperRef]
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: { id: string; data?: { agent?: string } }) => {
      event.preventDefault();
      setContextMenu({
        kind: 'node',
        position: { x: event.clientX, y: event.clientY },
        nodeId: node.id,
        agent: node.data?.agent,
      });
    },
    []
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextAddNode = useCallback(
    (agent: AgentOption, position: { readonly x: number; readonly y: number }) => {
      undoRedo.pushSnapshot(nodes, edges);
      const existingIds = new Set(nodes.map((n) => n.id));
      const nodeId = generateNodeId(agent.name, existingIds);
      const newNode: Node<DagNodeData> = {
        id: nodeId,
        type: 'dagNode',
        position: { x: position.x, y: position.y },
        data: { label: nodeId, agent: agent.name, task: '', checkpoint: false, nodeId, skills: [], mcpServers: [] },
      };
      setNodes((nds: Node<DagNodeData>[]) => [...nds, newNode]);
      setDirty(true);
    },
    [nodes, edges, setNodes, undoRedo, setDirty]
  );

  const handleContextAddNote = useCallback(
    (position: { readonly x: number; readonly y: number }) => {
      const noteId = `note-${Date.now()}`;
      const newNode: Node<DagNodeData> = {
        id: noteId,
        type: 'stickyNote',
        position: { x: position.x, y: position.y },
        data: {
          label: '',
          agent: '',
          task: '',
          checkpoint: false,
          nodeId: noteId,
          skills: [],
          mcpServers: [],
          text: '',
        },
      };
      setNodes((nds: Node<DagNodeData>[]) => [...nds, newNode]);
    },
    [setNodes]
  );

  const handleContextEditTask = useCallback(
    (nodeId: string) => {
      onNodeSelect(nodeId);
    },
    [onNodeSelect]
  );

  const handleContextToggleCheckpoint = useCallback(
    (nodeId: string) => {
      undoRedo.pushSnapshot(nodes, edges);
      setNodes((nds: Node<DagNodeData>[]) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, checkpoint: !n.data.checkpoint } }
            : n
        )
      );
      setDirty(true);
    },
    [setNodes, nodes, edges, undoRedo, setDirty]
  );

  const handleContextDeleteNode = useCallback(
    (nodeId: string) => {
      const agent = nodes.find((n) => n.id === nodeId)?.data?.agent;
      if (isProtectedNode(nodeId, agent)) return;
      undoRedo.pushSnapshot(nodes, edges);
      setNodes((nds: Node<DagNodeData>[]) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds: Edge[]) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setDirty(true);
    },
    [setNodes, setEdges, nodes, edges, undoRedo, setDirty]
  );

  return {
    contextMenu,
    handlePaneContextMenu,
    handleNodeContextMenu,
    handleCloseContextMenu,
    handleContextAddNode,
    handleContextAddNote,
    handleContextEditTask,
    handleContextToggleCheckpoint,
    handleContextDeleteNode,
  };
}
