export interface McpServerConfig {
  readonly command: string;
  readonly args: readonly string[];
  readonly env: Readonly<Record<string, string>>;
}

export interface HookCommand {
  readonly type: 'command';
  readonly command: string;
}

export interface HookEntry {
  readonly matcher: string;
  readonly hooks: readonly HookCommand[];
}

export type HookType = 'PreToolUse' | 'PostToolUse' | 'Stop';

export interface PermissionsConfig {
  readonly allow: readonly string[];
  readonly deny?: readonly string[];
}

export interface SettingsData {
  readonly mcpServers: Readonly<Record<string, McpServerConfig>>;
  readonly hooks: Readonly<Record<HookType, readonly HookEntry[]>>;
  readonly permissions?: PermissionsConfig;
  readonly skipDangerousModePermissionPrompt?: boolean;
  readonly [key: string]: unknown;
}

export function parseSettingsData(raw: Record<string, unknown>): SettingsData {
  const mcpServers = (raw.mcpServers ?? {}) as Record<string, McpServerConfig>;
  const hooks = (raw.hooks ?? {}) as Record<HookType, readonly HookEntry[]>;
  const rawPermissions = raw.permissions as Record<string, unknown> | undefined;
  const permissions: PermissionsConfig | undefined = rawPermissions
    ? {
        allow: (rawPermissions.allow ?? []) as readonly string[],
        ...(rawPermissions.deny ? { deny: rawPermissions.deny as readonly string[] } : {}),
      }
    : undefined;
  return { ...raw, mcpServers, hooks, permissions };
}

export function createEmptyMcpServer(): McpServerConfig {
  return { command: '', args: [], env: {} };
}

export function createEmptyHookEntry(): HookEntry {
  return { matcher: '', hooks: [{ type: 'command', command: '' }] };
}
