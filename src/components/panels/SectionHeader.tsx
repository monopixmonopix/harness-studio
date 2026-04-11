'use client';

import { useState, useCallback } from 'react';
import { Bot, GitBranch, FileText, Zap, Plug, BookOpen, Brain, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Icon component mapping for each resource section */
const SECTION_ICONS: Record<string, LucideIcon> = {
  Agents: Bot,
  Workflows: GitBranch,
  'CLAUDE.md': FileText,
  Skills: Zap,
  MCPs: Plug,
  Rules: BookOpen,
  Memories: Brain,
  'Claude Config': Settings,
};

/** Left-border accent colors per section (Tailwind arbitrary values) */
const SECTION_BORDER_COLORS: Record<string, string> = {
  Agents: 'border-l-blue-500',
  Workflows: 'border-l-purple-500',
  'CLAUDE.md': 'border-l-emerald-500',
  Skills: 'border-l-amber-500',
  MCPs: 'border-l-cyan-500',
  Rules: 'border-l-rose-400',
  Memories: 'border-l-violet-400',
  'Claude Config': 'border-l-slate-400',
};

interface SectionHeaderProps {
  readonly label: string;
  readonly count?: number;
  readonly defaultExpanded?: boolean;
  readonly collapsible?: boolean;
  readonly children?: React.ReactNode;
}

export function CollapsibleSection({
  label,
  count,
  defaultExpanded = true,
  children,
}: SectionHeaderProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  const IconComponent = SECTION_ICONS[label];
  const borderColor = SECTION_BORDER_COLORS[label] ?? 'border-l-transparent';

  return (
    <div className="mt-1.5">
      <button
        onClick={toggle}
        className={`flex w-full items-center gap-1.5 rounded-r px-2 py-1 text-left border-l-2 ${borderColor} bg-surface/50 hover:bg-surface-hover transition-colors`}
      >
        <span className="text-muted">
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
        {IconComponent && <IconComponent size={12} className="text-muted" />}
        <span className="text-[11px] font-semibold tracking-wide text-foreground/80">
          {label}
        </span>
        {count !== undefined && (
          <span className="ml-auto rounded-full bg-surface px-1.5 py-0 text-[10px] font-medium text-muted">
            {count}
          </span>
        )}
      </button>
      {expanded && (
        <div className="mt-0.5 pl-1">
          {children}
        </div>
      )}
    </div>
  );
}

interface StaticSectionHeaderProps {
  readonly label: string;
}

export function StaticSectionHeader({ label }: StaticSectionHeaderProps) {
  const IconComponent = SECTION_ICONS[label];
  const borderColor = SECTION_BORDER_COLORS[label] ?? 'border-l-transparent';

  return (
    <div
      className={`mt-1.5 flex items-center gap-1.5 rounded-r px-2 py-1 border-l-2 ${borderColor} bg-surface/50`}
    >
      {IconComponent && <IconComponent size={12} className="text-muted" />}
      <span className="text-[11px] font-semibold tracking-wide text-foreground/80">
        {label}
      </span>
    </div>
  );
}
