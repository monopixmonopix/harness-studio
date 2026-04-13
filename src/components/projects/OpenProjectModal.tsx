'use client';

import { useState, useCallback, useRef } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { useBrowseDirectories, usePickDirectory } from '@/lib/use-projects';

interface OpenProjectModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onOpen: (path: string) => void;
  readonly loading: boolean;
  readonly error: string | null;
}

export function OpenProjectModal({ open, onClose, onOpen, loading, error }: OpenProjectModalProps) {
  if (!open) return null;
  return (
    <OpenProjectModalInner
      onClose={onClose}
      onOpen={onOpen}
      loading={loading}
      error={error}
    />
  );
}

interface OpenProjectModalInnerProps {
  readonly onClose: () => void;
  readonly onOpen: (path: string) => void;
  readonly loading: boolean;
  readonly error: string | null;
}

function OpenProjectModalInner({ onClose, onOpen, loading, error }: OpenProjectModalInnerProps) {
  const [pathInput, setPathInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { entries, browse, clear } = useBrowseDirectories();
  const { pickDirectory, loading: picking } = usePickDirectory();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = useCallback(
    (value: string) => {
      setPathInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (value.length >= 2) {
        debounceRef.current = setTimeout(() => {
          browse(value);
          setShowSuggestions(true);
        }, 200);
      } else {
        clear();
        setShowSuggestions(false);
      }
    },
    [browse, clear]
  );

  const handleBrowse = useCallback(async () => {
    const selected = await pickDirectory();
    if (selected) {
      setPathInput(selected);
      clear();
      setShowSuggestions(false);
    }
  }, [pickDirectory, clear]);

  const handleSelectSuggestion = useCallback((entry: string) => {
    setPathInput(entry);
    setShowSuggestions(false);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = pathInput.trim();
    if (trimmed) {
      onOpen(trimmed);
    }
  }, [pathInput, onOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        onClose();
      }
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
            <FolderOpen size={14} />
            Open Project
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <label className="mb-1 block text-xs text-muted">Project Path</label>
          <div className="relative flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={pathInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => entries.length > 0 && setShowSuggestions(true)}
              placeholder="~/Claude/my-project"
              className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
            />
            <button
              onClick={handleBrowse}
              disabled={picking}
              title="Browse directories"
              className="shrink-0 rounded border border-border bg-background px-3 py-2 text-muted hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-50"
            >
              <FolderOpen size={14} />
            </button>
            {showSuggestions && entries.length > 0 && (
              <SuggestionList
                entries={entries}
                onSelect={handleSelectSuggestion}
              />
            )}
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-400">{error}</p>
          )}

          <p className="mt-2 text-[10px] text-muted">
            Type or paste a directory path. A .claude/ directory will be created if needed.
          </p>
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
            disabled={!pathInput.trim() || loading}
            className={`rounded px-4 py-1.5 text-xs transition-colors ${
              pathInput.trim() && !loading
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'cursor-not-allowed bg-surface text-muted'
            }`}
          >
            {loading ? 'Opening...' : 'Open'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SuggestionListProps {
  readonly entries: readonly string[];
  readonly onSelect: (entry: string) => void;
}

function SuggestionList({ entries, onSelect }: SuggestionListProps) {
  return (
    <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded border border-border bg-surface shadow-lg">
      {entries.map((entry) => (
        <li key={entry}>
          <button
            onClick={() => onSelect(entry)}
            className="w-full px-3 py-1.5 text-left text-xs text-foreground/80 hover:bg-surface-hover"
          >
            {entry}
          </button>
        </li>
      ))}
    </ul>
  );
}
