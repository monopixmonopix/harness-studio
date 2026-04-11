'use client';

import { useCallback } from 'react';
import { Zap } from 'lucide-react';
import type { SkillTemplate } from '@/lib/skill-templates';

interface SkillTemplateCardProps {
  readonly template: SkillTemplate;
  readonly onSelect: (template: SkillTemplate) => void;
}

export function SkillTemplateCard({ template, onSelect }: SkillTemplateCardProps) {
  const handleClick = useCallback(() => {
    onSelect(template);
  }, [template, onSelect]);

  return (
    <button
      onClick={handleClick}
      className="w-full rounded border border-border bg-background p-3 text-left transition-colors hover:border-accent/50 hover:bg-surface-hover"
    >
      <div className="flex items-center gap-2">
        <Zap size={14} className="shrink-0 text-muted" />
        <span className="text-xs font-medium text-foreground">{template.name}</span>
      </div>
      <p className="mt-1 pl-[22px] text-[10px] text-muted/70">{template.description}</p>
    </button>
  );
}
