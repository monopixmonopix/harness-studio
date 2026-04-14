'use client';

import { useMemo, useState, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { Resource, Workflow, WorkflowNode } from '@/types/resources';
import type { DagNodeData } from '@/lib/workflow-to-flow';
import { isProtectedNode } from '@/lib/workflow-constants';
import { ResourceEditor } from './ResourceEditor';
import { BindingSelector } from './BindingSelector';
import { MemoryPreview } from './MemoryPreview';

interface PropertyPanelProps {
  readonly resource: Resource | null;
  readonly selectedNodeId: string | null;
  readonly onUpdate: () => void;
  readonly canvasNodes?: readonly Node<DagNodeData>[];
  readonly canvasEdges?: readonly Edge[];
  readonly onUpdateNode?: (nodeId: string, data: Partial<DagNodeData>) => void;
  readonly onDeleteNode?: (nodeId: string) => void;
  readonly availableSkills?: readonly string[];
  readonly availableMcpServers?: readonly string[];
  readonly memories?: readonly Resource[];
  readonly onDeleteMemory?: (memory: Resource) => void;
  readonly editorFontSize?: number;
  readonly projectId?: string;
}

export function PropertyPanel({
  resource,
  selectedNodeId,
  onUpdate,
  canvasNodes,
  canvasEdges,
  onUpdateNode,
  onDeleteNode,
  availableSkills = [],
  availableMcpServers = [],
  memories = [],
  onDeleteMemory,
  editorFontSize,
  projectId,
}: PropertyPanelProps) {
  // Try to find the selected node from canvas nodes first, then fallback to frontmatter
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;

    // From canvas nodes (live state)
    if (canvasNodes) {
      const canvasNode = canvasNodes.find((n) => n.id === selectedNodeId);
      if (canvasNode) return canvasNode.data;
    }

    // Fallback: from workflow frontmatter
    if (resource?.frontmatter) {
      const wf = resource.frontmatter as unknown as Workflow;
      const wfNode = wf.nodes?.find((n: WorkflowNode) => n.id === selectedNodeId);
      if (wfNode) {
        return {
          label: wfNode.id,
          agent: wfNode.agent,
          task: wfNode.task,
          checkpoint: wfNode.checkpoint ?? false,
          nodeId: wfNode.id,
          skills: wfNode.skills ?? [],
          mcpServers: wfNode.mcp_servers ?? [],
        } satisfies DagNodeData;
      }
    }

    return null;
  }, [selectedNodeId, canvasNodes, resource?.frontmatter]);

  // Find dependencies (dispatch edges targeting this node)
  const dependencies = useMemo(() => {
    if (!selectedNodeId || !canvasEdges) return [];
    return canvasEdges
      .filter((e) => e.target === selectedNodeId && (e.data?.edgeType ?? 'dispatch') === 'dispatch')
      .map((e) => e.source);
  }, [selectedNodeId, canvasEdges]);

  // Find report targets (report edges sourced from this node)
  const reportsTo = useMemo(() => {
    if (!selectedNodeId || !canvasEdges) return [];
    return canvasEdges
      .filter((e) => e.source === selectedNodeId && e.data?.edgeType === 'report')
      .map((e) => e.target);
  }, [selectedNodeId, canvasEdges]);

  // Find sync peers (sync edges sourced from or targeting this node)
  const syncsWith = useMemo(() => {
    if (!selectedNodeId || !canvasEdges) return [];
    return canvasEdges
      .filter((e) => e.data?.edgeType === 'sync' && (e.source === selectedNodeId || e.target === selectedNodeId))
      .map((e) => e.source === selectedNodeId ? e.target : e.source);
  }, [selectedNodeId, canvasEdges]);

  // Find roundtrip partners (roundtrip edges where this node is source or target)
  const roundtripPartners = useMemo(() => {
    if (!selectedNodeId || !canvasEdges) return [];
    return canvasEdges
      .filter((e) => e.data?.edgeType === 'roundtrip' && (e.source === selectedNodeId || e.target === selectedNodeId))
      .map((e) => e.source === selectedNodeId ? e.target : e.source);
  }, [selectedNodeId, canvasEdges]);

  if (!resource && !selectedNode) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center p-3">
          <p className="text-xs text-muted">Select a resource to view properties</p>
        </div>
        <MemoryPreview memories={memories} onDelete={onDeleteMemory} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Resource header */}
      {resource && (
        <div className="border-b border-border p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Properties
          </h2>
          <p className="mt-1 text-sm font-medium">{resource.name}</p>
          <p className="text-xs text-muted">{resource.type}</p>
        </div>
      )}

      {/* Selected node editor */}
      {selectedNode && selectedNodeId && (
        <NodeEditor
          key={selectedNodeId}
          nodeId={selectedNodeId}
          data={selectedNode}
          dependencies={dependencies}
          reportsTo={reportsTo}
          syncsWith={syncsWith}
          roundtripPartners={roundtripPartners}
          onUpdateNode={onUpdateNode}
          onDeleteNode={onDeleteNode}
          availableSkills={availableSkills}
          availableMcpServers={availableMcpServers}
        />
      )}

      {/* Editor (only show when no node is selected and resource exists) */}
      {!selectedNode && resource && (
        <div className="flex-1 overflow-hidden">
          <ResourceEditor resource={resource} onSave={onUpdate} fontSize={editorFontSize} projectId={projectId} />
        </div>
      )}

      {/* Memory reference (always at the bottom) */}
      <MemoryPreview memories={memories} onDelete={onDeleteMemory} />
    </div>
  );
}

interface NodeEditorProps {
  readonly nodeId: string;
  readonly data: DagNodeData;
  readonly dependencies: readonly string[];
  readonly reportsTo: readonly string[];
  readonly syncsWith: readonly string[];
  readonly roundtripPartners: readonly string[];
  readonly onUpdateNode?: (nodeId: string, data: Partial<DagNodeData>) => void;
  readonly onDeleteNode?: (nodeId: string) => void;
  readonly availableSkills: readonly string[];
  readonly availableMcpServers: readonly string[];
}

function NodeEditor({ nodeId, data, dependencies, reportsTo, syncsWith, roundtripPartners, onUpdateNode, onDeleteNode, availableSkills, availableMcpServers }: NodeEditorProps) {
  // Only task needs local state (continuous typing); skills, mcpServers, and checkpoint
  // are read directly from `data` prop so external updates (e.g. drag-drop) are reflected immediately.
  const [task, setTask] = useState(data.task);

  const skills = data.skills;
  const mcpServers = data.mcpServers;
  const checkpoint = data.checkpoint;

  const handleTaskChange = useCallback(
    (newTask: string) => {
      setTask(newTask);
      onUpdateNode?.(nodeId, { task: newTask });
    },
    [nodeId, onUpdateNode]
  );

  const handleCheckpointChange = useCallback(
    (newCheckpoint: boolean) => {
      onUpdateNode?.(nodeId, { checkpoint: newCheckpoint });
    },
    [nodeId, onUpdateNode]
  );

  const handleAddSkill = useCallback(
    (skill: string) => {
      if (skills.includes(skill)) return;
      const next = [...skills, skill];
      onUpdateNode?.(nodeId, { skills: next });
    },
    [nodeId, skills, onUpdateNode]
  );

  const handleRemoveSkill = useCallback(
    (skill: string) => {
      const next = skills.filter((s) => s !== skill);
      onUpdateNode?.(nodeId, { skills: next });
    },
    [nodeId, skills, onUpdateNode]
  );

  const handleAddMcp = useCallback(
    (mcp: string) => {
      if (mcpServers.includes(mcp)) return;
      const next = [...mcpServers, mcp];
      onUpdateNode?.(nodeId, { mcpServers: next });
    },
    [nodeId, mcpServers, onUpdateNode]
  );

  const handleRemoveMcp = useCallback(
    (mcp: string) => {
      const next = mcpServers.filter((m) => m !== mcp);
      onUpdateNode?.(nodeId, { mcpServers: next });
    },
    [nodeId, mcpServers, onUpdateNode]
  );

  const unboundSkills = useMemo(
    () => availableSkills.filter((s) => !skills.includes(s)),
    [availableSkills, skills]
  );

  const unboundMcps = useMemo(
    () => availableMcpServers.filter((m) => !mcpServers.includes(m)),
    [availableMcpServers, mcpServers]
  );

  return (
    <div className="border-b border-border p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
        Node Editor
      </h3>

      <div className="mt-3 flex flex-col gap-3">
        {/* Node ID (read-only) */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
            ID
          </label>
          <div className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground/70">
            {nodeId}
          </div>
        </div>

        {/* Agent (read-only) */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
            Agent
          </label>
          <div className="rounded border border-border bg-background px-2 py-1 text-xs text-accent">
            {data.agent}
          </div>
        </div>

        {/* Task (editable) */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
            Task
          </label>
          <textarea
            value={task}
            onChange={(e) => handleTaskChange(e.target.value)}
            placeholder="Describe what this agent should do..."
            rows={4}
            className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none resize-y"
          />
        </div>

        {/* Dependencies (read-only, shown from edges) */}
        {dependencies.length > 0 && (
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
              Depends On
            </label>
            <div className="flex flex-wrap gap-1">
              {dependencies.map((dep) => (
                <span
                  key={dep}
                  className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] text-foreground/70"
                >
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reports To (read-only, shown from report edges) */}
        {reportsTo.length > 0 && (
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
              Reports To
            </label>
            <div className="flex flex-wrap gap-1">
              {reportsTo.map((target) => (
                <span
                  key={target}
                  className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-400"
                >
                  {target}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Syncs With (read-only, shown from sync edges) */}
        {syncsWith.length > 0 && (
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
              Syncs With
            </label>
            <div className="flex flex-wrap gap-1">
              {syncsWith.map((peer) => (
                <span
                  key={peer}
                  className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-400"
                >
                  {peer}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Roundtrip (read-only, shown from roundtrip edges) */}
        {roundtripPartners.length > 0 && (
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
              Roundtrip
            </label>
            <div className="flex flex-wrap gap-1">
              {roundtripPartners.map((partner) => (
                <span
                  key={partner}
                  className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] text-teal-400"
                >
                  {partner}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Checkpoint toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCheckpointChange(!checkpoint)}
            className={`relative h-4 w-7 rounded-full transition-colors ${
              checkpoint ? 'bg-amber-500' : 'bg-border'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                checkpoint ? 'translate-x-3' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-xs text-foreground/70">Checkpoint</span>
        </div>

        {/* Skills section */}
        <div className="border-t border-border pt-3">
          <BindingSelector
            label="Skills"
            count={skills.length}
            bound={skills}
            available={unboundSkills}
            onAdd={handleAddSkill}
            onRemove={handleRemoveSkill}
            badgeClassName="bg-emerald-500/20 text-emerald-400"
            addButtonClassName="text-emerald-400/70 hover:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
          />
        </div>

        {/* MCP Servers section */}
        <div className="border-t border-border pt-3">
          <BindingSelector
            label="MCP Servers"
            count={mcpServers.length}
            bound={mcpServers}
            available={unboundMcps}
            onAdd={handleAddMcp}
            onRemove={handleRemoveMcp}
            badgeClassName="bg-blue-500/20 text-blue-400"
            addButtonClassName="text-blue-400/70 hover:text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
          />
        </div>

        {/* Delete button (hidden for protected nodes) */}
        {onDeleteNode && !isProtectedNode(nodeId) && (
          <button
            onClick={() => onDeleteNode(nodeId)}
            className="mt-1 rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Delete Node
          </button>
        )}
      </div>
    </div>
  );
}
