'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FolderOpen, Plus, X, ChevronDown, Trash2 } from 'lucide-react';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleSelectRecent = useCallback(
    (path: string) => {
      onSelectRecent(path);
      setDropdownOpen(false);
    },
    [onSelectRecent]
  );

  const handleRemoveRecent = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.stopPropagation();
      onRemoveRecent(path);
    },
    [onRemoveRecent]
  );

  if (loading) {
    return (
      <div className="rounded border border-border bg-background px-2 py-1.5 text-xs text-muted">
        Opening project...
      </div>
    );
  }

  // No project open
  if (!activeProject) {
    return (
      <div className="mb-2 space-y-1.5">
        <div className="rounded border border-border bg-background px-2 py-1.5 text-xs text-muted">
          No project open
        </div>
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
      </div>
    );
  }

  // Has active project — single row with dropdown
  return (
    <div ref={containerRef} className="relative mb-2">
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex w-full items-center gap-1 rounded border border-border bg-background px-2 py-1.5 text-left transition-colors hover:border-accent/50"
      >
        <FolderOpen size={12} className="shrink-0 text-accent" />
        <span className="flex-1 truncate text-xs font-medium text-foreground">
          {activeProject.name}
        </span>
        <ChevronDown
          size={12}
          className={`shrink-0 text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {dropdownOpen && (
        <div className="absolute left-0 right-0 z-10 mt-0.5 rounded border border-border bg-surface shadow-lg">
          {/* Recent projects */}
          {recentProjects.length > 0 && (
            <>
              <div className="px-2 pt-1.5 pb-0.5">
                <span className="text-[9px] uppercase tracking-wider text-muted">Recent Projects</span>
              </div>
              <ul>
                {recentProjects.map((p) => (
                  <li key={p.path}>
                    <button
                      onClick={() => handleSelectRecent(p.path)}
                      className="group flex w-full items-center gap-1 px-2 py-1 text-left text-xs text-foreground/70 hover:bg-surface-hover"
                    >
                      <span className="flex-1 truncate" title={p.path}>
                        {shortenPath(p.path)}
                      </span>
                      <Trash2
                        size={10}
                        className="shrink-0 text-muted/0 group-hover:text-muted/50 hover:!text-red-400 transition-colors"
                        onClick={(e) => handleRemoveRecent(e, p.path)}
                      />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border" />
            </>
          )}

          {/* Action buttons */}
          <div className="py-0.5">
            <button
              onClick={() => { onOpenProject(); setDropdownOpen(false); }}
              className="flex w-full items-center gap-1.5 px-2 py-1 text-xs text-foreground/70 hover:bg-surface-hover"
            >
              <FolderOpen size={10} />
              Open Project
            </button>
            <button
              onClick={() => { onNewProject(); setDropdownOpen(false); }}
              className="flex w-full items-center gap-1.5 px-2 py-1 text-xs text-foreground/70 hover:bg-surface-hover"
            >
              <Plus size={10} />
              New Project
            </button>
            <button
              onClick={() => { onCloseProject(); setDropdownOpen(false); }}
              className="flex w-full items-center gap-1.5 px-2 py-1 text-xs text-red-400/70 hover:bg-surface-hover hover:text-red-400"
            >
              <X size={10} />
              Close Project
            </button>
          </div>
        </div>
      )}
    </div>
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
