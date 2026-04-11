export type ResourceType = 'agents' | 'workflows' | 'skills' | 'rules' | 'mcps' | 'hooks' | 'memories';

export interface Resource {
  readonly id: string;
  readonly type: ResourceType;
  readonly name: string;
  readonly path: string;
  readonly content: string;
  readonly frontmatter?: Record<string, unknown>;
  readonly modifiedAt?: string;
}

export type MemoryType = 'user' | 'feedback' | 'project' | 'reference';

export interface MemoryGroup {
  readonly type: MemoryType;
  readonly items: readonly Resource[];
}

export interface WorkflowNode {
  readonly id: string;
  readonly agent: string;
  readonly task: string;
  readonly depends_on?: readonly string[];
  readonly reports_to?: readonly string[];
  readonly syncs_with?: readonly string[];
  readonly roundtrip?: readonly string[];
  readonly checkpoint?: boolean;
  readonly skills?: readonly string[];
  readonly mcp_servers?: readonly string[];
}

export interface Workflow {
  readonly name: string;
  readonly description: string;
  readonly version: number;
  readonly nodes: readonly WorkflowNode[];
}

export interface FileChangeEvent {
  readonly type: 'add' | 'change' | 'unlink';
  readonly path: string;
  readonly resourceType: ResourceType;
}

export interface ProjectSummary {
  readonly id: string;
  readonly name: string;
  readonly path: string;
}

export interface Project extends ProjectSummary {
  readonly agents: readonly Resource[];
  readonly workflows: readonly Resource[];
  readonly skills: readonly Resource[];
  readonly memories: readonly Resource[];
  readonly claudeMd?: string;
}

export type AuxiliaryType = 'skills' | 'rules' | 'commands' | 'settings';

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}
