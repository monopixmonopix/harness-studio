'use client';

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import type { PermissionsConfig } from '@/types/settings';

interface GeneralTabProps {
  readonly permissions: PermissionsConfig | undefined;
  readonly skipDangerousModePermissionPrompt: boolean;
  readonly onChange: (updates: GeneralTabChanges) => void;
}

export interface GeneralTabChanges {
  readonly permissions?: PermissionsConfig;
  readonly skipDangerousModePermissionPrompt?: boolean;
}

export function GeneralTab({
  permissions,
  skipDangerousModePermissionPrompt,
  onChange,
}: GeneralTabProps) {
  const allowedTools = permissions?.allow ?? [];

  const handleToggleDangerousMode = useCallback(
    (checked: boolean) => {
      onChange({ skipDangerousModePermissionPrompt: checked });
    },
    [onChange]
  );

  const handleAddTool = useCallback(
    (tool: string) => {
      const current = permissions ?? { allow: [] };
      const updatedAllow = [...current.allow, tool];
      onChange({
        permissions: { ...current, allow: updatedAllow },
      });
    },
    [permissions, onChange]
  );

  const handleRemoveTool = useCallback(
    (index: number) => {
      const current = permissions ?? { allow: [] };
      const updatedAllow = current.allow.filter((_, i) => i !== index);
      onChange({
        permissions: { ...current, allow: updatedAllow },
      });
    },
    [permissions, onChange]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Dangerous Mode Toggle */}
      <ToggleRow
        label="Skip Dangerous Mode Prompt"
        description="Skip confirmation when enabling dangerous mode"
        checked={skipDangerousModePermissionPrompt}
        onChange={handleToggleDangerousMode}
      />

      {/* Allowed Tools */}
      <AllowedToolsList
        tools={allowedTools}
        onAdd={handleAddTool}
        onRemove={handleRemoveTool}
      />
    </div>
  );
}

interface ToggleRowProps {
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between rounded border border-border bg-background px-3 py-2.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-[10px] text-muted">{description}</span>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? 'bg-accent' : 'bg-surface-hover'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
    </div>
  );
}

interface AllowedToolsListProps {
  readonly tools: readonly string[];
  readonly onAdd: (tool: string) => void;
  readonly onRemove: (index: number) => void;
}

function AllowedToolsList({ tools, onAdd, onRemove }: AllowedToolsListProps) {
  const [newTool, setNewTool] = useState('');

  const handleAdd = useCallback(() => {
    const trimmed = newTool.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewTool('');
  }, [newTool, onAdd]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Allowed Tools (permissions.allow)
        </span>
        <span className="text-[10px] text-muted">{tools.length} rule{tools.length !== 1 ? 's' : ''}</span>
      </div>

      {tools.length === 0 && (
        <p className="rounded border border-border bg-background px-3 py-3 text-center text-[10px] text-muted/60">
          No allowed tool rules configured
        </p>
      )}

      {tools.length > 0 && (
        <ul className="flex flex-col gap-1">
          {tools.map((tool, idx) => (
            <li
              key={`${idx}-${tool}`}
              className="flex items-center justify-between rounded border border-border bg-background px-3 py-1.5"
            >
              <span className="text-xs font-mono text-foreground">{tool}</span>
              <button
                onClick={() => onRemove(idx)}
                className="rounded p-0.5 text-red-400 hover:bg-red-400/10 hover:text-red-300"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTool}
          onChange={(e) => setNewTool(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder='e.g. Bash(git *:*), Write, mcp__*'
          className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={!newTool.trim()}
          className="rounded bg-accent px-3 py-1 text-xs text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
