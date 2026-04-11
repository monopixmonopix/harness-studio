'use client';

import { useState, useCallback } from 'react';
import { Download, Package } from 'lucide-react';
import type { Resource } from '@/types/resources';
import { buildPluginZip, triggerDownload } from '@/lib/plugin-export';

interface ExportTabProps {
  readonly projectName: string;
  readonly agents: readonly Resource[];
  readonly skills: readonly Resource[];
}

export function ExportTab({ projectName, agents, skills }: ExportTabProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setError(null);
    setSuccess(false);

    try {
      const agentFiles = agents.map((a) => ({
        path: `${a.name}.md`,
        content: a.content,
      }));

      const skillFiles = skills.map((s) => ({
        path: `${s.name}/SKILL.md`,
        content: s.content,
      }));

      const blob = await buildPluginZip({
        projectName,
        agents: agentFiles,
        skills: skillFiles,
      });

      triggerDownload(blob, `${projectName}-plugin.zip`);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [projectName, agents, skills]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-medium text-foreground">Export as Plugin</h3>
        <p className="mt-1 text-[10px] text-muted">
          Package this project&apos;s agents and skills as a Claude Code plugin zip file.
        </p>
      </div>

      {/* Preview */}
      <div className="rounded border border-border bg-background p-3">
        <div className="flex items-center gap-2 text-xs text-foreground/80">
          <Package size={14} className="text-muted" />
          <span className="font-medium">{projectName}-plugin/</span>
        </div>
        <div className="mt-2 space-y-0.5 pl-6 font-mono text-[10px] text-muted">
          <p>.claude-plugin/plugin.json</p>
          {agents.length > 0 && (
            <p>agents/ ({agents.length} file{agents.length !== 1 ? 's' : ''})</p>
          )}
          {skills.length > 0 && (
            <p>skills/ ({skills.length} skill{skills.length !== 1 ? 's' : ''})</p>
          )}
          <p>README.md</p>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <p className="text-[10px] text-red-400">{error}</p>
      )}
      {success && (
        <p className="text-[10px] text-green-400">Plugin exported successfully!</p>
      )}

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={exporting || (agents.length === 0 && skills.length === 0)}
        className={`flex items-center gap-2 rounded px-4 py-2 text-xs transition-colors ${
          exporting || (agents.length === 0 && skills.length === 0)
            ? 'cursor-not-allowed bg-surface text-muted'
            : 'bg-accent text-white hover:bg-accent-hover'
        }`}
      >
        <Download size={14} />
        {exporting ? 'Exporting...' : 'Export Plugin'}
      </button>

      {agents.length === 0 && skills.length === 0 && (
        <p className="text-[10px] text-muted/60">
          Add agents or skills to this project before exporting.
        </p>
      )}
    </div>
  );
}
