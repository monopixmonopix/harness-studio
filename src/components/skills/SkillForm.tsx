'use client';

import { useCallback } from 'react';
import type { SkillFormData } from './SkillCreateModal';

interface SkillFormProps {
  readonly data: SkillFormData;
  readonly onChange: (data: SkillFormData) => void;
}

export function SkillForm({ data, onChange }: SkillFormProps) {
  const updateField = useCallback(
    <K extends keyof SkillFormData>(field: K, value: SkillFormData[K]) => {
      onChange({ ...data, [field]: value });
    },
    [data, onChange],
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
          placeholder="my-skill (kebab-case)"
          className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
          autoFocus
        />
        <p className="mt-0.5 text-[10px] text-muted/60">
          Will be saved as .claude/skills/{data.name || '...'}/SKILL.md
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-foreground/80">Description</label>
        <input
          type="text"
          value={data.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Brief description of this skill"
          className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
        />
      </div>

      {/* Body / instructions */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-foreground/80">
          Instructions
        </label>
        <textarea
          value={data.body}
          onChange={(e) => updateField('body', e.target.value)}
          placeholder="Skill instructions (markdown)..."
          className="h-40 w-full resize-y rounded border border-border bg-background p-3 font-mono text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  );
}
