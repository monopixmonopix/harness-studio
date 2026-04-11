'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FolderOpen, Plus, X, Clock, Trash2 } from 'lucide-react';
import type { Project } from '@/types/resources';
import type { RecentProject } from '@/lib/use-projects';

interface ProjectSelectorProps {
  readonly activeProject: Project | null;
  readonly recentProjects: readonly RecentProject[];
  readonly onOpenProject: () => void;
  readonly onNewProject: () => void;
  readonly onCloseProject: () => void;
  readonly onSelectRecent: (path: string) => void;
  readonly onRemoveRecent: (path: string) => void;
  readonly loading: boolean;
}

export function ProjectSelector({
  activeProject,
  recentProjects,
  onOpenProject,
  onNewProject,
  onCloseProject,
  onSelectRecent,
  onRemoveRecent,
  loading,
}: ProjectSelectorProps) {
  const [showRecent, setShowRecent] = useState(false);
  const recentRef = useRef<HTMLDivElement>(null);

  // Close recent list on outside click
  useEffect(() => {
    if (!showRecent) return;
    function handleClickOutside(e: MouseEvent) {
      if (recentRef.current && !recentRef.current.contains(e.target as Node)) {
        setShowRecent(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRecent]);

  if (loading) {
    return (
      <div className="rounded border border-border bg-background px-2 py-1.5 text-xs text-muted">
        Opening project...
      </div>
    );
  }

  return (
    <div className="mb-2 space-y-1.5">
      {/* Current project header */}
      {activeProject && (
        <div className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1.5">
          <FolderOpen size={12} className="shrink-0 text-accent" />
          <span className="flex-1 truncate text-xs font-medium text-foreground">
            {activeProject.name}
          </span>
          <button
            onClick={onCloseProject}
            className="shrink-0 rounded p-0.5 text-muted hover:bg-surface-hover hover:text-foreground"
            title="Close project"
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-1">
        <button
          onClick={onOpenProject}
          className="flex flex-1 items-center justify-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground/80 hover:border-accent/50 hover:text-accent transition-colors"
        >
          <FolderOpen size={10} />
          Open
        </button>
        <button
          onClick={onNewProject}
          className="flex flex-1 items-center justify-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground/80 hover:border-accent/50 hover:text-accent transition-colors"
        >
          <Plus size={10} />
          New
        </button>
      </div>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <div ref={recentRef} className="relative">
          <button
            onClick={() => setShowRecent((prev) => !prev)}
            className="flex w-full items-center gap-1 px-1 py-0.5 text-[10px] text-muted hover:text-foreground/70 transition-colors"
          >
            <Clock size={9} />
            <span>Recent Projects</span>
          </button>
          {showRecent && (
            <RecentProjectList
              projects={recentProjects}
              onSelect={(p) => {
                onSelectRecent(p);
                setShowRecent(false);
              }}
              onRemove={onRemoveRecent}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface RecentProjectListProps {
  readonly projects: readonly RecentProject[];
  readonly onSelect: (path: string) => void;
  readonly onRemove: (path: string) => void;
}

function RecentProjectList({ projects, onSelect, onRemove }: RecentProjectListProps) {
  const handleRemove = useCallback(
    (e: React.MouseEvent, projectPath: string) => {
      e.stopPropagation();
      onRemove(projectPath);
    },
    [onRemove]
  );

  return (
    <ul className="mt-0.5 rounded border border-border bg-surface shadow-lg">
      {projects.map((p) => (
        <li key={p.path}>
          <button
            onClick={() => onSelect(p.path)}
            className="group flex w-full items-center gap-1 px-2 py-1 text-left text-xs text-foreground/70 hover:bg-surface-hover"
          >
            <span className="flex-1 truncate" title={p.path}>
              {shortenPath(p.path)}
            </span>
            <Trash2
              size={10}
              className="shrink-0 text-muted/0 group-hover:text-muted/50 hover:!text-red-400 transition-colors"
              onClick={(e) => handleRemove(e, p.path)}
            />
          </button>
        </li>
      ))}
    </ul>
  );
}

function shortenPath(fullPath: string): string {
  const home = typeof window !== 'undefined' ? '' : '';
  // Simple heuristic: replace /Users/<username> with ~
  const match = fullPath.match(/^\/Users\/[^/]+\//);
  if (match) {
    return '~/' + fullPath.slice(match[0].length);
  }
  return home + fullPath;
}
