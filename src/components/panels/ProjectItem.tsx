'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Circle, Plus } from 'lucide-react';
import type { Project, Resource } from '@/types/resources';

interface ProjectItemProps {
  readonly project: Project;
  readonly selectedId: string | null;
  readonly onSelectResource: (resource: Resource) => void;
  readonly onSelectClaudeMd: (project: Project) => void;
  readonly onCreateWorkflow?: (project: Project) => void;
  readonly defaultExpanded?: boolean;
}

export function ProjectItem({
  project,
  selectedId,
  onSelectResource,
  onSelectClaudeMd,
  onCreateWorkflow,
  defaultExpanded = false,
}: ProjectItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const hasContent =
    project.agents.length > 0 ||
    project.workflows.length > 0 ||
    project.claudeMd !== undefined;

  const toggle = useCallback(() => {
    if (hasContent) setExpanded((prev) => !prev);
  }, [hasContent]);

  const claudeMdId = `${project.id}:CLAUDE.md`;

  return (
    <div className="mb-0.5">
      {/* Project header */}
      <button
        onClick={toggle}
        className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs font-medium text-foreground/90 hover:bg-surface-hover"
      >
        <span className="text-muted">
          {hasContent ? (expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />) : <Circle size={8} />}
        </span>
        <span className="flex-1 truncate">{project.name}</span>
        <ResourceCounts project={project} />
      </button>

      {/* Expanded content */}
      {expanded && hasContent && (
        <div className="ml-3 border-l border-border/50 pl-2">
          {project.agents.length > 0 && (
            <DraggableSubGroup
              label="Agents"
              items={project.agents}
              selectedId={selectedId}
              onSelect={onSelectResource}
            />
          )}
          {project.workflows.length > 0 && (
            <SubGroup
              label="Workflows"
              items={project.workflows}
              selectedId={selectedId}
              onSelect={onSelectResource}
            />
          )}
          {onCreateWorkflow && (
            <button
              onClick={() => onCreateWorkflow(project)}
              className="mt-0.5 w-full rounded px-2 py-0.5 text-left text-xs text-accent/70 hover:bg-surface-hover hover:text-accent transition-colors"
            >
              <span className="flex items-center gap-1"><Plus size={12} /> New Workflow</span>
            </button>
          )}
          {project.claudeMd !== undefined && (
            <button
              onClick={() => onSelectClaudeMd(project)}
              className={`mt-0.5 w-full rounded px-2 py-0.5 text-left text-xs transition-colors ${
                selectedId === claudeMdId
                  ? 'bg-accent/20 text-accent'
                  : 'text-foreground/70 hover:bg-surface-hover'
              }`}
            >
              CLAUDE.md
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ResourceCounts({ project }: { readonly project: Project }) {
  const counts: string[] = [];
  if (project.agents.length > 0) counts.push(`${project.agents.length}A`);
  if (project.workflows.length > 0) counts.push(`${project.workflows.length}W`);

  if (counts.length === 0) return null;

  return (
    <span className="text-[10px] text-muted/60">{counts.join(' ')}</span>
  );
}

interface SubGroupProps {
  readonly label: string;
  readonly items: readonly Resource[];
  readonly selectedId: string | null;
  readonly onSelect: (resource: Resource) => void;
}

function SubGroup({ label, items, selectedId, onSelect }: SubGroupProps) {
  return (
    <div className="mt-0.5">
      <span className="px-2 text-[9px] font-semibold uppercase tracking-wider text-muted/70">
        {label}
      </span>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onSelect(item)}
              className={`w-full rounded px-2 py-0.5 text-left text-xs transition-colors ${
                selectedId === item.id
                  ? 'bg-accent/20 text-accent'
                  : 'text-foreground/70 hover:bg-surface-hover'
              }`}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DraggableSubGroup({ label, items, selectedId, onSelect }: SubGroupProps) {
  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, item: Resource) => {
      event.dataTransfer.setData(
        'application/cc-agent',
        JSON.stringify({ agent: item.name, agentId: item.id })
      );
      event.dataTransfer.effectAllowed = 'copy';
    },
    []
  );

  return (
    <div className="mt-0.5">
      <span className="px-2 text-[9px] font-semibold uppercase tracking-wider text-muted/70">
        {label}
      </span>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <button
              draggable="true"
              onDragStart={(e) => handleDragStart(e, item)}
              onClick={() => onSelect(item)}
              className={`w-full rounded px-2 py-0.5 text-left text-xs transition-colors cursor-grab active:cursor-grabbing ${
                selectedId === item.id
                  ? 'bg-accent/20 text-accent'
                  : 'text-foreground/70 hover:bg-surface-hover'
              }`}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
