'use client';

import { useCallback } from 'react';
import { Cpu } from 'lucide-react';
import type { AgentTemplate } from '@/lib/agent-templates';

const MODEL_COLORS: Record<string, string> = {
  opus: 'bg-amber-500/20 text-amber-400',
  sonnet: 'bg-blue-500/20 text-blue-400',
  haiku: 'bg-green-500/20 text-green-400',
};

interface AgentTemplateCardProps {
  readonly template: AgentTemplate;
  readonly onSelect: (template: AgentTemplate) => void;
}

export function AgentTemplateCard({ template, onSelect }: AgentTemplateCardProps) {
  const handleClick = useCallback(() => {
    onSelect(template);
  }, [template, onSelect]);

  const modelColor = MODEL_COLORS[template.frontmatter.model] ?? 'bg-surface text-muted';

  return (
    <button
      onClick={handleClick}
      className="w-full rounded border border-border bg-background p-3 text-left transition-colors hover:border-accent/50 hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="shrink-0 text-muted" />
          <span className="text-xs font-medium text-foreground">{template.name}</span>
        </div>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${modelColor}`}>
          {template.frontmatter.model}
        </span>
      </div>
      <p className="mt-1 pl-[22px] text-[10px] text-muted/70">{template.description}</p>
    </button>
  );
}
