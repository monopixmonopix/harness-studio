'use client';

import { useMemo } from 'react';
import type { Resource, ResourceType } from '@/types/resources';
import { groupByType } from '@/lib/use-resources';

const TYPE_LABELS: Record<ResourceType, string> = {
  agents: 'Agents',
  workflows: 'Workflows',
  skills: 'Skills',
  rules: 'Rules',
  mcps: 'MCPs',
  hooks: 'Hooks',
  memories: 'Memories',
};

const TYPE_ORDER: ResourceType[] = ['agents', 'workflows', 'skills', 'rules', 'mcps', 'hooks', 'memories'];

interface ResourcePanelProps {
  readonly resources: readonly Resource[];
  readonly selectedId: string | null;
  readonly onSelect: (resource: Resource) => void;
  readonly onDelete?: (resource: Resource) => void;
  readonly loading: boolean;
}

export function ResourcePanel({ resources, selectedId, onSelect, onDelete, loading }: ResourcePanelProps) {
  const grouped = useMemo(() => groupByType(resources), [resources]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-xs text-muted">Loading...</span>
      </div>
    );
  }

  return (
    <nav className="flex flex-col gap-1">
      {TYPE_ORDER.map((type) => {
        const items = grouped[type];
        if (items.length === 0) return null;

        return (
          <ResourceGroup
            key={type}
            type={type}
            items={items}
            selectedId={selectedId}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        );
      })}

      {resources.length === 0 && (
        <p className="px-2 py-4 text-center text-xs text-muted">
          No resources found in ~/.claude/
        </p>
      )}
    </nav>
  );
}

interface ResourceGroupProps {
  readonly type: ResourceType;
  readonly items: readonly Resource[];
  readonly selectedId: string | null;
  readonly onSelect: (resource: Resource) => void;
  readonly onDelete?: (resource: Resource) => void;
}

function ResourceGroup({ type, items, selectedId, onSelect, onDelete }: ResourceGroupProps) {
  return (
    <div className="mb-2">
      <h3 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {TYPE_LABELS[type]}
        <span className="ml-1 text-muted/60">{items.length}</span>
      </h3>
      <ul className="flex flex-col gap-px">
        {items.map((item) => (
          <ResourceItem
            key={item.id}
            item={item}
            selected={selectedId === item.id}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}

interface ResourceItemProps {
  readonly item: Resource;
  readonly selected: boolean;
  readonly onSelect: (resource: Resource) => void;
  readonly onDelete?: (resource: Resource) => void;
}

function ResourceItem({ item, selected, onSelect, onDelete }: ResourceItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(item);
    }
  };

  return (
    <li className="group">
      <div
        className={`flex items-center rounded transition-colors ${
          selected
            ? 'bg-accent/20 text-accent'
            : 'text-foreground/80 hover:bg-surface-hover'
        }`}
      >
        <button
          onClick={() => onSelect(item)}
          className="flex-1 px-2 py-1 text-left text-xs"
        >
          {item.name}
        </button>
        {onDelete && (
          <button
            onClick={handleDelete}
            className="mr-1 hidden rounded p-0.5 text-muted hover:bg-red-500/20 hover:text-red-400 group-hover:block"
            title={`Delete ${item.name}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
}
