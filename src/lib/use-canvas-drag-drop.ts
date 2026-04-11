'use client';

import { useCallback, useRef } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';
import type { DagNodeData } from '@/lib/workflow-to-flow';
import { generateNodeId } from '@/lib/edge-utils';
import type { useUndoRedo } from '@/lib/use-undo-history';
import type { Edge } from '@xyflow/react';

interface AgentDropData {
  readonly agent: string;
  readonly agentId: string;
}

interface UseCanvasDragDropParams {
  readonly nodes: Node<DagNodeData>[];
  readonly edges: Edge[];
  readonly setNodes: (updater: (nds: Node<DagNodeData>[]) => Node<DagNodeData>[]) => void;
  readonly setDirty: (dirty: boolean) => void;
  readonly undoRedo: ReturnType<typeof useUndoRedo>;
}

interface UseCanvasDragDropResult {
  readonly wrapperRef: React.RefObject<HTMLDivElement | null>;
  readonly handleDragOver: (event: React.DragEvent) => void;
  readonly handleDrop: (event: React.DragEvent) => void;
}

export function useCanvasDragDrop({
  nodes,
  edges,
  setNodes,
  setDirty,
  undoRedo,
}: UseCanvasDragDropParams): UseCanvasDragDropResult {
  const reactFlowInstance = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    const types = event.dataTransfer.types;
    if (types.includes('application/cc-agent') || types.includes('application/cc-skill') || types.includes('application/cc-mcp')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const bounds = wrapperRef.current?.getBoundingClientRect();
      if (!bounds) return;

      const flowPos = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Skill/MCP drops are handled by DagNode -> CustomEvent path
      const skillRaw = event.dataTransfer.getData('application/cc-skill');
      if (skillRaw) return;
      const mcpRaw = event.dataTransfer.getData('application/cc-mcp');
      if (mcpRaw) return;

      const raw = event.dataTransfer.getData('application/cc-agent');
      if (!raw) return;

      let dropData: AgentDropData;
      try {
        dropData = JSON.parse(raw) as AgentDropData;
      } catch {
        return;
      }

      const existingIds = new Set(nodes.map((n) => n.id));
      const nodeId = generateNodeId(dropData.agent, existingIds);

      undoRedo.pushSnapshot(nodes, edges);

      const newNode: Node<DagNodeData> = {
        id: nodeId,
        type: 'dagNode',
        position: flowPos,
        data: {
          label: nodeId,
          agent: dropData.agent,
          task: '',
          checkpoint: false,
          nodeId,
          skills: [],
          mcpServers: [],
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setDirty(true);
    },
    [nodes, edges, reactFlowInstance, setNodes, undoRedo, setDirty]
  );

  return { wrapperRef, handleDragOver, handleDrop };
}
