'use client';

import { useCallback } from 'react';
import type { AgentFormData } from './AgentCreateModal';

interface AgentFormProps {
  readonly data: AgentFormData;
  readonly onChange: (data: AgentFormData) => void;
  readonly allTools: readonly string[];
  readonly models: readonly { readonly value: string; readonly label: string }[];
}

export function AgentForm({ data, onChange, allTools, models }: AgentFormProps) {
  const updateField = useCallback(
    <K extends keyof AgentFormData>(field: K, value: AgentFormData[K]) => {
      onChange({ ...data, [field]: value });
    },
    [data, onChange],
  );

  const handleToolToggle = useCallback(
    (tool: string) => {
      const next = data.tools.includes(tool)
        ? data.tools.filter((t) => t !== tool)
        : [...data.tools, tool];
      updateField('tools', next);
    },
    [data.tools, updateField],
  );

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-foreground/80">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="my-agent (kebab-case)"
          className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
          autoFocus
        />
        <p className="mt-0.5 text-[10px] text-muted/60">
          Will be saved as .claude/agents/{data.name || '...'}.md
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-foreground/80">Description</label>
        <input
          type="text"
          value={data.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Brief description of this agent"
          className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
        />
      </div>

      {/* Model */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-foreground/80">Model</label>
        <select
          value={data.model}
          onChange={(e) => updateField('model', e.target.value)}
          className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
        >
          {models.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Tools */}
      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-foreground/80">Tools</label>
        <div className="flex flex-wrap gap-2">
          {allTools.map((tool) => (
            <label key={tool} className="flex items-center gap-1.5 text-xs text-foreground/70">
              <input
                type="checkbox"
                checked={data.tools.includes(tool)}
                onChange={() => handleToolToggle(tool)}
                className="rounded border-border"
              />
              {tool}
            </label>
          ))}
        </div>
      </div>

      {/* Body / system prompt */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-foreground/80">
          System Prompt
        </label>
        <textarea
          value={data.body}
          onChange={(e) => updateField('body', e.target.value)}
          placeholder="Agent system prompt (markdown)..."
          className="h-40 w-full resize-y rounded border border-border bg-background p-3 font-mono text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  );
}
