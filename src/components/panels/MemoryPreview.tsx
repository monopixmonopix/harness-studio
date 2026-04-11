'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  User,
  MessageSquare,
  FolderOpen,
  Link,
  X,
  Eye,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Resource, MemoryType, MemoryGroup } from '@/types/resources';
import { formatRelativeTime } from '@/lib/format-relative-time';

const MEMORY_TYPE_CONFIG: Record<MemoryType, { readonly label: string; readonly icon: LucideIcon }> = {
  user: { label: 'User', icon: User },
  feedback: { label: 'Feedback', icon: MessageSquare },
  project: { label: 'Project', icon: FolderOpen },
  reference: { label: 'Reference', icon: Link },
};

const MEMORY_TYPE_ORDER: readonly MemoryType[] = ['user', 'feedback', 'project', 'reference'];

const PREVIEW_CHAR_LIMIT = 200;

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

function truncateContent(content: string): string {
  if (content.length <= PREVIEW_CHAR_LIMIT) return content;
  return content.slice(0, PREVIEW_CHAR_LIMIT) + '...';
}

interface MemoryPreviewProps {
  readonly memories: readonly Resource[];
  readonly onDelete?: (memory: Resource) => void;
}

export function MemoryPreview({ memories, onDelete }: MemoryPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((prev) => !prev), []);
  const groups = useMemo(() => groupMemoriesByType(memories), [memories]);

  if (memories.length === 0) return null;

  return (
    <div className="border-t border-border">
      <button
        onClick={toggle}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-left hover:bg-surface-hover transition-colors"
      >
        <span className="text-muted">
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
        <Brain size={12} className="text-violet-400" />
        <span className="text-[11px] font-semibold tracking-wide text-foreground/80">
          Project Memory
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Eye size={10} className="text-muted/50" />
          <span className="rounded-full bg-surface px-1.5 py-0 text-[10px] font-medium text-muted">
            {memories.length}
          </span>
        </span>
      </button>
      {expanded && (
        <div className="px-2 pb-2">
          {groups.map((group) => (
            <MemoryTypeGroup
              key={group.type}
              group={group}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MemoryTypeGroupProps {
  readonly group: MemoryGroup;
  readonly onDelete?: (memory: Resource) => void;
}

function MemoryTypeGroup({ group, onDelete }: MemoryTypeGroupProps) {
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
        <ul className="mt-0.5 flex flex-col gap-0.5">
          {group.items.map((item) => (
            <MemoryItem key={item.id} memory={item} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}

interface MemoryItemProps {
  readonly memory: Resource;
  readonly onDelete?: (memory: Resource) => void;
}

function MemoryItem({ memory, onDelete }: MemoryItemProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const togglePreview = useCallback(() => setPreviewOpen((prev) => !prev), []);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(true);
  }, []);

  const handleConfirmDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(memory);
      setConfirmDelete(false);
    },
    [memory, onDelete],
  );

  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
  }, []);

  return (
    <li className="rounded border border-border/30 bg-background/50">
      <button
        onClick={togglePreview}
        className="flex w-full items-center gap-1 px-2 py-1 text-left hover:bg-surface-hover transition-colors rounded"
      >
        <span className="flex-1 truncate text-xs text-foreground/70">
          {memory.name}
        </span>
        {memory.modifiedAt && (
          <span className="shrink-0 text-[9px] text-muted/50">
            {formatRelativeTime(memory.modifiedAt)}
          </span>
        )}
        {confirmDelete ? (
          <span className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleConfirmDelete}
              className="rounded px-1 py-0.5 text-[9px] text-red-400 hover:bg-red-500/20"
            >
              Delete?
            </button>
            <button
              onClick={handleCancelDelete}
              className="rounded px-1 py-0.5 text-[9px] text-muted hover:bg-surface-hover"
            >
              No
            </button>
          </span>
        ) : (
          onDelete && (
            <X
              size={10}
              className="shrink-0 text-muted/30 hover:text-red-400 transition-colors cursor-pointer"
              onClick={handleDeleteClick}
            />
          )
        )}
      </button>
      {previewOpen && (
        <div className="border-t border-border/20 px-2 py-1.5">
          <pre className="whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-foreground/50">
            {truncateContent(memory.content)}
          </pre>
        </div>
      )}
    </li>
  );
}
