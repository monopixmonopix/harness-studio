'use client';

import { useState, useCallback } from 'react';
import { X, Sparkles, FolderPlus, Code, Users } from 'lucide-react';
import { PROJECT_TEMPLATES, type ProjectTemplate } from '@/lib/project-templates';

export interface NewProjectFormData {
  readonly name: string;
  readonly parentDir: string;
  readonly template: ProjectTemplate;
}

interface NewProjectModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCreate: (data: NewProjectFormData) => void;
  readonly loading: boolean;
  readonly error: string | null;
}

const TEMPLATE_ICONS: Record<ProjectTemplate, typeof Code> = {
  blank: FolderPlus,
  'dev-team': Code,
  'ops-team': Users,
};

export function NewProjectModal({ open, onClose, onCreate, loading, error }: NewProjectModalProps) {
  if (!open) return null;
  return (
    <NewProjectModalInner
      onClose={onClose}
      onCreate={onCreate}
      loading={loading}
      error={error}
    />
  );
}

interface NewProjectModalInnerProps {
  readonly onClose: () => void;
  readonly onCreate: (data: NewProjectFormData) => void;
  readonly loading: boolean;
  readonly error: string | null;
}

function NewProjectModalInner({ onClose, onCreate, loading, error }: NewProjectModalInnerProps) {
  const [name, setName] = useState('');
  const [parentDir, setParentDir] = useState('~/Claude');
  const [template, setTemplate] = useState<ProjectTemplate>('blank');

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), parentDir, template });
  }, [name, parentDir, template, onCreate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
      if (e.key === 'Escape') onClose();
    },
    [handleSubmit, onClose]
  );

  const handleOverlayMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={handleOverlayMouseDown}
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles size={14} />
            New Project
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-5">
          {/* Project name */}
          <div>
            <label className="mb-1 block text-xs text-muted">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="my-project"
              autoFocus
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
            />
          </div>

          {/* Parent directory */}
          <div>
            <label className="mb-1 block text-xs text-muted">Parent Directory</label>
            <input
              type="text"
              value={parentDir}
              onChange={(e) => setParentDir(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="~/Claude"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
            />
            {name.trim() && (
              <p className="mt-1 text-[10px] text-muted">
                Will create: {parentDir}/{name.trim()}
              </p>
            )}
          </div>

          {/* Template selection */}
          <div>
            <label className="mb-1.5 block text-xs text-muted">Template</label>
            <TemplateSelector selected={template} onSelect={setTemplate} />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded px-3 py-1.5 text-xs text-muted hover:bg-surface-hover hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className={`rounded px-4 py-1.5 text-xs transition-colors ${
              name.trim() && !loading
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'cursor-not-allowed bg-surface text-muted'
            }`}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TemplateSelectorProps {
  readonly selected: ProjectTemplate;
  readonly onSelect: (template: ProjectTemplate) => void;
}

function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {PROJECT_TEMPLATES.map((tpl) => {
        const Icon = TEMPLATE_ICONS[tpl.id];
        const isActive = selected === tpl.id;
        return (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl.id)}
            className={`rounded border p-3 text-left transition-colors ${
              isActive
                ? 'border-accent/60 bg-accent/10'
                : 'border-border hover:border-accent/30 hover:bg-surface-hover'
            }`}
          >
            <Icon size={16} className={isActive ? 'text-accent' : 'text-muted'} />
            <span className="mt-1.5 block text-xs font-medium text-foreground">{tpl.name}</span>
            <span className="block text-[10px] text-muted">{tpl.description}</span>
          </button>
        );
      })}
    </div>
  );
}
