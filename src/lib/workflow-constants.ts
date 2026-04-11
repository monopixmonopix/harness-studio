/** Node IDs that are protected from deletion. These are default nodes in every workflow. */
export const PROTECTED_NODE_IDS: ReadonlySet<string> = new Set(['user', 'coordinator']);

/** Returns true if the given node ID is protected from deletion. */
export function isProtectedNode(nodeId: string): boolean {
  return PROTECTED_NODE_IDS.has(nodeId);
}
