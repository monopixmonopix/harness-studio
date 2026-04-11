'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { StudioSettings } from '@/lib/use-studio-settings';

type StudioSettingsTab = 'appearance' | 'preferences';

interface StudioSettingsModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly settings: StudioSettings;
  readonly onUpdateSetting: <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => void;
}

export function StudioSettingsModal({ open, onClose, settings, onUpdateSetting }: StudioSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<StudioSettingsTab>('appearance');

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-border bg-surface shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <TabButton label="Appearance" active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
          <TabButton label="Preferences" active={activeTab === 'preferences'} onClick={() => setActiveTab('preferences')} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeTab === 'appearance' && (
            <AppearanceTab settings={settings} onUpdate={onUpdateSetting} />
          )}
          {activeTab === 'preferences' && (
            <PreferencesTab settings={settings} onUpdate={onUpdateSetting} />
          )}
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

interface TabProps {
  readonly settings: StudioSettings;
  readonly onUpdate: <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => void;
}

function AppearanceTab({ settings, onUpdate }: TabProps) {
  return (
    <div className="flex flex-col gap-4">
      <SettingRow label="Language">
        <select
          value={settings.language}
          onChange={(e) => onUpdate('language', e.target.value as StudioSettings['language'])}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
        >
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </SettingRow>

      <SettingRow label="Theme">
        <select
          value={settings.theme}
          onChange={(e) => onUpdate('theme', e.target.value as StudioSettings['theme'])}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
        >
          <option value="claude-dark">Claude Dark</option>
          <option value="system">System</option>
        </select>
      </SettingRow>

      <SettingRow label="Editor font size">
        <input
          type="number"
          min={8}
          max={24}
          value={settings.editorFontSize}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= 8 && val <= 24) {
              onUpdate('editorFontSize', val);
            }
          }}
          className="w-16 rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
        />
      </SettingRow>

      <SettingRow label="Canvas grid">
        <ToggleSwitch
          checked={settings.showCanvasGrid}
          onChange={(v) => onUpdate('showCanvasGrid', v)}
        />
      </SettingRow>

      <SettingRow label="Minimap">
        <ToggleSwitch
          checked={settings.showMinimap}
          onChange={(v) => onUpdate('showMinimap', v)}
        />
      </SettingRow>
    </div>
  );
}

function PreferencesTab({ settings, onUpdate }: TabProps) {
  return (
    <div className="flex flex-col gap-4">
      <SettingRow label="Auto-save">
        <ToggleSwitch
          checked={settings.autoSave}
          onChange={(v) => onUpdate('autoSave', v)}
        />
      </SettingRow>

      <SettingRow label="Default model for new agents">
        <select
          value={settings.defaultModel}
          onChange={(e) => onUpdate('defaultModel', e.target.value as StudioSettings['defaultModel'])}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
        >
          <option value="opus">Opus</option>
          <option value="sonnet">Sonnet</option>
          <option value="haiku">Haiku</option>
        </select>
      </SettingRow>

      <SettingRow label="Confirm before delete">
        <ToggleSwitch
          checked={settings.confirmBeforeDelete}
          onChange={(v) => onUpdate('confirmBeforeDelete', v)}
        />
      </SettingRow>

      <SettingRow label="Animation speed">
        <select
          value={settings.animationSpeed}
          onChange={(e) => onUpdate('animationSpeed', e.target.value as StudioSettings['animationSpeed'])}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
        >
          <option value="fast">Fast</option>
          <option value="normal">Normal</option>
          <option value="slow">Slow</option>
        </select>
      </SettingRow>
    </div>
  );
}

interface SettingRowProps {
  readonly label: string;
  readonly children: React.ReactNode;
}

function SettingRow({ label, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-foreground/80">{label}</span>
      {children}
    </div>
  );
}

interface ToggleSwitchProps {
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-border transition-colors ${
        checked ? 'bg-accent' : 'bg-background'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
