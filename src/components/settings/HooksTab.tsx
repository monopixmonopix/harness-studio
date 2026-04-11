'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import type { HookEntry, HookType, HookCommand } from '@/types/settings';
import { createEmptyHookEntry } from '@/types/settings';

const HOOK_TYPES: readonly HookType[] = ['PreToolUse', 'PostToolUse', 'Stop'] as const;

interface HooksTabProps {
  readonly hooks: Readonly<Record<HookType, readonly HookEntry[]>>;
  readonly onChange: (hooks: Readonly<Record<HookType, readonly HookEntry[]>>) => void;
}

export function HooksTab({ hooks, onChange }: HooksTabProps) {
  const [expandedType, setExpandedType] = useState<HookType | null>(null);

  const handleAddEntry = useCallback((hookType: HookType) => {
    const existing = hooks[hookType] ?? [];
    onChange({ ...hooks, [hookType]: [...existing, createEmptyHookEntry()] });
  }, [hooks, onChange]);

  const handleUpdateEntry = useCallback((hookType: HookType, index: number, updated: HookEntry) => {
    const existing = hooks[hookType] ?? [];
    const next = existing.map((entry, i) => (i === index ? updated : entry));
    onChange({ ...hooks, [hookType]: next });
  }, [hooks, onChange]);

  const handleRemoveEntry = useCallback((hookType: HookType, index: number) => {
    const existing = hooks[hookType] ?? [];
    const next = existing.filter((_, i) => i !== index);
    onChange({ ...hooks, [hookType]: next });
  }, [hooks, onChange]);

  return (
    <div className="flex flex-col gap-3">
      {HOOK_TYPES.map((hookType) => {
        const entries = hooks[hookType] ?? [];
        const isExpanded = expandedType === hookType;

        return (
          <div key={hookType} className="rounded border border-border bg-background">
            <button
              onClick={() => setExpandedType(isExpanded ? null : hookType)}
              className="flex w-full items-center justify-between px-3 py-2"
            >
              <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                <span className="text-muted">{isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>
                {hookType}
              </span>
              <span className="text-[10px] text-muted">{entries.length} hook{entries.length !== 1 ? 's' : ''}</span>
            </button>

            {isExpanded && (
              <div className="flex flex-col gap-2 border-t border-border px-3 py-2">
                {entries.length === 0 && (
                  <p className="py-2 text-center text-[10px] text-muted/60">No hooks configured</p>
                )}

                {entries.map((entry, idx) => (
                  <HookEntryItem
                    key={idx}
                    entry={entry}
                    onUpdate={(updated) => handleUpdateEntry(hookType, idx, updated)}
                    onRemove={() => handleRemoveEntry(hookType, idx)}
                  />
                ))}

                <button
                  onClick={() => handleAddEntry(hookType)}
                  className="mt-1 rounded border border-dashed border-border px-2 py-1 text-xs text-accent/70 hover:border-accent hover:text-accent"
                >
                  + Add Hook
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface HookEntryItemProps {
  readonly entry: HookEntry;
  readonly onUpdate: (entry: HookEntry) => void;
  readonly onRemove: () => void;
}

function HookEntryItem({ entry, onUpdate, onRemove }: HookEntryItemProps) {
  const handleMatcherChange = useCallback((matcher: string) => {
    onUpdate({ ...entry, matcher });
  }, [entry, onUpdate]);

  const handleCommandChange = useCallback((index: number, command: string) => {
    const updatedHooks = entry.hooks.map((h, i) =>
      i === index ? { ...h, command } : h
    );
    onUpdate({ ...entry, hooks: updatedHooks });
  }, [entry, onUpdate]);

  const handleAddCommand = useCallback(() => {
    const newCommand: HookCommand = { type: 'command', command: '' };
    onUpdate({ ...entry, hooks: [...entry.hooks, newCommand] });
  }, [entry, onUpdate]);

  const handleRemoveCommand = useCallback((index: number) => {
    onUpdate({ ...entry, hooks: entry.hooks.filter((_, i) => i !== index) });
  }, [entry, onUpdate]);

  return (
    <div className="rounded border border-border bg-surface p-2">
      <div className="flex items-center justify-between mb-2">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Matcher</span>
          <input
            type="text"
            value={entry.matcher}
            onChange={(e) => handleMatcherChange(e.target.value)}
            placeholder="e.g. Bash, Write, *"
            className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none font-mono"
          />
        </label>
        <button
          onClick={onRemove}
          className="ml-2 mt-4 rounded px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-400/10"
        >
          Remove
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Commands</span>
          <button
            onClick={handleAddCommand}
            className="text-[10px] text-accent hover:text-accent-hover"
          >
            + Add
          </button>
        </div>
        {entry.hooks.map((hook, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <input
              type="text"
              value={hook.command}
              onChange={(e) => handleCommandChange(idx, e.target.value)}
              placeholder="command to run"
              className="flex-1 rounded border border-border bg-background px-2 py-0.5 text-[11px] font-mono text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
            />
            {entry.hooks.length > 1 && (
              <button
                onClick={() => handleRemoveCommand(idx)}
                className="text-red-400 hover:text-red-300"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
