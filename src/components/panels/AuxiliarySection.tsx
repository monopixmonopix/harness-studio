'use client';

import { useCallback } from 'react';
import { GripVertical } from 'lucide-react';
import type { Resource, ResourceType } from '@/types/resources';
import { CollapsibleSection } from './SectionHeader';

type DragMimeType = 'application/cc-skill' | 'application/cc-mcp';

const DRAG_MIME_MAP: Partial<Record<ResourceType, DragMimeType>> = {
  skills: 'application/cc-skill',
} as const;

interface ResourceSectionProps {
  readonly label: string;
  readonly type: ResourceType;
  readonly items: readonly Resource[];
  readonly selectedId: string | null;
  readonly onSelect: (resource: Resource) => void;
}

export function ResourceSection({ label, type, items, selectedId, onSelect }: ResourceSectionProps) {
  const mimeType = DRAG_MIME_MAP[type];

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, item: Resource) => {
      if (!mimeType) return;
      event.dataTransfer.setData(mimeType, JSON.stringify({ name: item.name }));
      event.dataTransfer.effectAllowed = 'copy';
    },
    [mimeType]
  );

  if (items.length === 0) return null;

  return (
    <CollapsibleSection label={label} count={items.length} defaultExpanded={false}>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <button
              draggable={mimeType != null}
              onDragStart={(e) => handleDragStart(e, item)}
              onClick={() => onSelect(item)}
              className={`group w-full rounded px-3 py-0.5 text-left text-xs transition-colors ${
                mimeType ? 'cursor-grab active:cursor-grabbing' : ''
              } ${
                selectedId === item.id
                  ? 'bg-accent/20 text-accent font-medium'
                  : 'text-foreground/70 hover:bg-surface-hover'
              }`}
            >
              <span className="flex items-center gap-1">
                {mimeType ? (
                  <GripVertical size={10} className="text-muted/0 group-hover:text-muted/50 transition-colors" />
                ) : (
                  <span className="inline-block w-[10px]" />
                )}
                {item.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}

interface McpSectionProps {
  readonly names: readonly string[];
}

export function McpSection({ names }: McpSectionProps) {
  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, name: string) => {
      event.dataTransfer.setData('application/cc-mcp', JSON.stringify({ name }));
      event.dataTransfer.effectAllowed = 'copy';
    },
    []
  );

  if (names.length === 0) return null;

  return (
    <CollapsibleSection label="MCPs" count={names.length} defaultExpanded={false}>
      <ul className="flex flex-col">
        {names.map((name) => (
          <li key={name}>
            <button
              draggable
              onDragStart={(e) => handleDragStart(e, name)}
              className="group w-full rounded px-3 py-0.5 text-left text-xs text-foreground/70 hover:bg-surface-hover cursor-grab active:cursor-grabbing"
            >
              <span className="flex items-center gap-1">
                <GripVertical size={10} className="text-muted/0 group-hover:text-muted/50 transition-colors" />
                {name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}

/* Legacy wrapper — kept for backwards compatibility but no longer nests */
interface AuxiliarySectionProps {
  readonly resources: readonly Resource[];
  readonly selectedId: string | null;
  readonly onSelect: (resource: Resource) => void;
  readonly mcpServerNames?: readonly string[];
}

export function AuxiliarySection({ resources, selectedId, onSelect, mcpServerNames = [] }: AuxiliarySectionProps) {
  const skills = resources.filter((r) => r.type === 'skills');
  const rules = resources.filter((r) => r.type === 'rules');

  return (
    <div className="border-t border-border/30 pt-1">
      <ResourceSection label="Skills" type="skills" items={skills} selectedId={selectedId} onSelect={onSelect} />
      <McpSection names={[...mcpServerNames]} />
      <ResourceSection label="Rules" type="rules" items={rules} selectedId={selectedId} onSelect={onSelect} />
    </div>
  );
}
