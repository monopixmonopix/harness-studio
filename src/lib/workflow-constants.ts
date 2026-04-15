/** Node IDs that are protected from deletion. These are default nodes in every workflow. */
export const PROTECTED_NODE_IDS: ReadonlySet<string> = new Set(['user', 'team-lead']);

/** Agent names that are protected from deletion regardless of node ID. */
export const PROTECTED_AGENTS: ReadonlySet<string> = new Set(['user', 'team-lead']);

/** Returns true if the given node is protected from deletion (by node ID or agent name). */
export function isProtectedNode(nodeId: string, agent?: string): boolean {
  return PROTECTED_NODE_IDS.has(nodeId) || (agent != null && PROTECTED_AGENTS.has(agent));
}
