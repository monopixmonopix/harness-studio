'use client';

import { useMemo, useState, useCallback } from 'react';
import { User, MessageSquare, FolderOpen, Link, ChevronDown, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Resource, MemoryType, MemoryGroup } from '@/types/resources';
import { CollapsibleSection } from './SectionHeader';
import { formatRelativeTime } from '@/lib/format-relative-time';

const MEMORY_TYPE_CONFIG: Record<MemoryType, { readonly label: string; readonly icon: LucideIcon }> = {
  user: { label: 'User', icon: User },
  feedback: { label: 'Feedback', icon: MessageSquare },
  project: { label: 'Project', icon: FolderOpen },
  reference: { label: 'Reference', icon: Link },
};

const MEMORY_TYPE_ORDER: readonly MemoryType[] = ['user', 'feedback', 'project', 'reference'];

function groupMemoriesByType(memories: readonly Resource[]): readonly MemoryGroup[] {
  const grouped = new Map<MemoryType, Resource[]>();

  for (const memory of memories) {
    const memoryType = (memory.frontmatter?.type as MemoryType) ?? 'reference';
    const validType = MEMORY_TYPE_ORDER.includes(memoryType) ? memoryType : 'reference';
    const existing = grouped.get(validType) ?? [];
    grouped.set(validType, [...existing, memory]);
  }

  return MEMORY_TYPE_ORDER
    .filter((type) => grouped.has(type))
    .map((type) => ({ type, items: grouped.get(type) ?? [] }));
}

interface MemorySubGroupProps {
  readonly group: MemoryGroup;
  readonly selectedId: string | null;
  readonly onSelect: (resource: Resource) => void;
}

function MemorySubGroup({ group, selectedId, onSelect }: MemorySubGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  const config = MEMORY_TYPE_CONFIG[group.type];
  const IconComponent = config.icon;

  return (
    <div className="mt-0.5">
      <button
        onClick={toggle}
        className="flex w-full items-center gap-1 rounded px-2 py-0.5 text-left hover:bg-surface-hover transition-colors"
      >
        <span className="text-muted">
          {expanded ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
        </span>
        <IconComponent size={10} className="text-muted" />
        <span className="text-[10px] font-medium text-foreground/60">
          {config.label}
        </span>
        <span className="ml-auto text-[9px] text-muted/60">
          {group.items.length}
        </span>
      </button>
      {expanded && (
        <ul className="flex flex-col mt-0.5">
          {group.items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSelect(item)}
                className={`w-full rounded px-3 py-0.5 text-left text-xs transition-colors ${
                  selectedId === item.id
                    ? 'bg-accent/20 text-accent font-medium'
                    : 'text-foreground/70 hover:bg-surface-hover'
                }`}
              >
                <span className="flex items-center justify-between gap-1">
                  <span className="inline-block w-[10px]" />
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.modifiedAt && (
                    <span className="shrink-0 text-[9px] text-muted/50">
                      {formatRelativeTime(item.modifiedAt)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface MemorySectionProps {
  readonly memories: readonly Resource[];
  readonly selectedId: string | null;
  readonly onSelect: (resource: Resource) => void;
}

export function MemorySection({ memories, selectedId, onSelect }: MemorySectionProps) {
  const groups = useMemo(() => groupMemoriesByType(memories), [memories]);

  if (memories.length === 0) return null;

  return (
    <CollapsibleSection label="Memories" count={memories.length} defaultExpanded={false}>
      <div className="pl-1">
        {groups.map((group) => (
          <MemorySubGroup
            key={group.type}
            group={group}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </CollapsibleSection>
  );
}
