'use client';

import { useCallback, useState } from 'react';
import { Wand2, X, Loader2 } from 'lucide-react';

interface GenerateModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onGenerate: (description: string) => void;
  readonly generating?: boolean;
  readonly error?: string | null;
}

export function GenerateModal({ open, onClose, onGenerate, generating = false, error = null }: GenerateModalProps) {
  const [description, setDescription] = useState('');

  const handleGenerate = useCallback(() => {
    const trimmed = description.trim();
    if (trimmed.length === 0 || generating) return;
    onGenerate(trimmed);
  }, [description, onGenerate, generating]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleGenerate();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [handleGenerate, onClose],
  );

  const handleOverlayMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !generating) {
        onClose();
      }
    },
    [onClose, generating],
  );

  const handleClose = useCallback(() => {
    if (!generating) {
      setDescription('');
      onClose();
    }
  }, [generating, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={handleOverlayMouseDown}
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Wand2 size={16} className="text-accent" />
            Generate Workflow
          </h2>
          <button
            onClick={handleClose}
            disabled={generating}
            className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>

        {/* Description input */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your workflow... e.g. Build a content ops team with research, writing, review, and publishing stages"
          className="mb-3 h-28 w-full resize-none rounded border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none disabled:opacity-50"
          disabled={generating}
          autoFocus
        />

        {/* Status / Error */}
        {generating && (
          <div className="mb-3 flex items-center gap-2 rounded bg-accent/10 px-3 py-2 text-[11px] text-accent">
            <Loader2 size={12} className="animate-spin" />
            Generating with Claude... this may take 10-30 seconds
          </div>
        )}
        {error && !generating && (
          <div className="mb-3 rounded bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
            {error}
          </div>
        )}

        {/* Hint */}
        <p className="mb-4 text-[10px] text-muted">
          AI-powered generation via Claude CLI. Describe your workflow in natural language.
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={generating}
            className="rounded px-3 py-1.5 text-xs text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={description.trim().length === 0 || generating}
            className={`flex items-center gap-1 rounded px-4 py-1.5 text-xs transition-colors ${
              description.trim().length > 0 && !generating
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-surface text-muted cursor-not-allowed'
            }`}
          >
            {generating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Wand2 size={12} />
            )}
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
