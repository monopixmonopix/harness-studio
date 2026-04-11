'use client';

import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Resource } from '@/types/resources';
import type { SettingsData, McpServerConfig, HookType, HookEntry } from '@/types/settings';
import { useSettings } from '@/lib/use-settings';
import { McpServersTab } from './McpServersTab';
import { HooksTab } from './HooksTab';
import { GeneralTab } from './GeneralTab';
import { ExportTab } from './ExportTab';
import type { GeneralTabChanges } from './GeneralTab';

type SettingsTab = 'general' | 'mcp' | 'hooks' | 'export';

interface SettingsModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly settingsPath: string;
  readonly projectName?: string;
  readonly projectAgents?: readonly Resource[];
  readonly projectSkills?: readonly Resource[];
}

export function SettingsModal({ open, onClose, settingsPath, projectName, projectAgents = [], projectSkills = [] }: SettingsModalProps) {
  const { settings, loading, error, save, saving } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [draft, setDraft] = useState<SettingsData | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync draft with loaded settings
  useEffect(() => {
    if (settings) {
      setDraft(settings);
      setDirty(false);
      setSaveError(null);
    }
  }, [settings]);

  const handleMcpChange = useCallback((mcpServers: Readonly<Record<string, McpServerConfig>>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, mcpServers };
    });
    setDirty(true);
  }, []);

  const handleHooksChange = useCallback((hooks: Readonly<Record<HookType, readonly HookEntry[]>>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, hooks };
    });
    setDirty(true);
  }, []);

  const handleGeneralChange = useCallback((changes: GeneralTabChanges) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, ...changes };
    });
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!draft) return;
    setSaveError(null);
    const success = await save(draft);
    if (success) {
      setDirty(false);
    } else {
      setSaveError('Failed to save settings');
    }
  }, [draft, save]);

  const handleClose = useCallback(() => {
    setDirty(false);
    setSaveError(null);
    onClose();
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={handleClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-surface shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Claude Config</h2>
            <p className="text-[10px] text-muted font-mono">{settingsPath}</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <TabButton
            label="General"
            active={activeTab === 'general'}
            onClick={() => setActiveTab('general')}
          />
          <TabButton
            label="MCP Servers"
            active={activeTab === 'mcp'}
            onClick={() => setActiveTab('mcp')}
          />
          <TabButton
            label="Hooks"
            active={activeTab === 'hooks'}
            onClick={() => setActiveTab('hooks')}
          />
          {projectName && (
            <TabButton
              label="Export"
              active={activeTab === 'export'}
              onClick={() => setActiveTab('export')}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && (
            <p className="py-8 text-center text-xs text-muted">Loading settings...</p>
          )}

          {error && !loading && (
            <p className="py-8 text-center text-xs text-red-400">{error}</p>
          )}

          {!loading && draft && activeTab === 'general' && (
            <GeneralTab
              permissions={draft.permissions}
              skipDangerousModePermissionPrompt={draft.skipDangerousModePermissionPrompt === true}
              onChange={handleGeneralChange}
            />
          )}

          {!loading && draft && activeTab === 'mcp' && (
            <McpServersTab
              servers={draft.mcpServers}
              onChange={handleMcpChange}
            />
          )}

          {!loading && draft && activeTab === 'hooks' && (
            <HooksTab
              hooks={draft.hooks}
              onChange={handleHooksChange}
            />
          )}

          {activeTab === 'export' && projectName && (
            <ExportTab
              projectName={projectName}
              agents={[...projectAgents]}
              skills={[...projectSkills]}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <span className="text-[10px] text-muted">
            {saveError && <span className="text-red-400">{saveError}</span>}
          </span>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={`rounded px-4 py-1 text-xs transition-colors ${
              dirty
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-surface text-muted cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : dirty ? 'Save' : 'Saved'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs transition-colors ${
        active
          ? 'border-b-2 border-accent text-foreground'
          : 'text-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
