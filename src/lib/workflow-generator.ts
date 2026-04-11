import type { Node, Edge } from '@xyflow/react';
import type { DagNodeData } from './workflow-to-flow';
import { generateNodeId } from './edge-utils';
import { DISPATCH_EDGE_STYLE } from './workflow-to-flow';

// --- Types ---

interface GeneratorInput {
  readonly description: string;
  readonly availableAgents: readonly string[];
}

interface GeneratedWorkflow {
  readonly name: string;
  readonly nodes: Node<DagNodeData>[];
  readonly edges: Edge[];
  readonly suggestedDescription: string;
}

// --- Pattern definitions ---

interface TaskPattern {
  readonly type: string;
  readonly agents: readonly string[];
  readonly tasks: readonly string[];
}

interface PlatformPattern {
  readonly platform: string;
  readonly agent: string;
}

type PatternEntry =
  | { readonly kind: 'task'; readonly regex: RegExp; readonly pattern: TaskPattern }
  | { readonly kind: 'platform'; readonly regex: RegExp; readonly pattern: PlatformPattern };

const TASK_PATTERNS: readonly PatternEntry[] = [
  {
    kind: 'task',
    regex: /运营|巡查|评论|互动/,
    pattern: { type: 'ops', agents: ['ops-operator'], tasks: ['评论巡查', '用户互动'] },
  },
  {
    kind: 'task',
    regex: /发布|内容|创作|写作/,
    pattern: { type: 'content', agents: ['ops-operator'], tasks: ['内容创作', '发布'] },
  },
  {
    kind: 'task',
    regex: /调研|热点|趋势/,
    pattern: { type: 'research', agents: ['ops-operator'], tasks: ['热点调研'] },
  },
  {
    kind: 'task',
    regex: /开发|修复|bug|feature/i,
    pattern: { type: 'dev', agents: ['developer'], tasks: ['需求开发', '测试验证'] },
  },
  {
    kind: 'task',
    regex: /代码审查|review|pr/i,
    pattern: { type: 'review', agents: ['code-reviewer'], tasks: ['代码审查', '安全扫描'] },
  },
  {
    kind: 'task',
    regex: /部署|发版|release/i,
    pattern: { type: 'deploy', agents: ['developer'], tasks: ['编译验证', '发布部署'] },
  },
  {
    kind: 'task',
    regex: /分析|报告|数据/,
    pattern: { type: 'analysis', agents: ['analyst'], tasks: ['数据收集', '分析报告'] },
  },
  {
    kind: 'task',
    regex: /投研|股票|市场/,
    pattern: { type: 'investment', agents: ['stock-agents-developer'], tasks: ['市场分析', '投研报告'] },
  },
] as const;

const PLATFORM_PATTERNS: readonly PatternEntry[] = [
  { kind: 'platform', regex: /小红书|xhs|xiaohongshu/i, pattern: { platform: 'xhs', agent: 'ops-operator' } },
  { kind: 'platform', regex: /掘金|juejin/i, pattern: { platform: 'juejin', agent: 'ops-operator' } },
  { kind: 'platform', regex: /抖音|douyin|tiktok/i, pattern: { platform: 'douyin', agent: 'ops-operator' } },
  { kind: 'platform', regex: /github/i, pattern: { platform: 'github', agent: 'ops-operator' } },
  { kind: 'platform', regex: /twitter|x\.com/i, pattern: { platform: 'twitter', agent: 'ops-operator' } },
] as const;

// --- Helpers ---

function matchTaskPatterns(description: string): readonly TaskPattern[] {
  const matched: TaskPattern[] = [];
  const seenTypes = new Set<string>();

  for (const entry of TASK_PATTERNS) {
    if (entry.kind !== 'task') continue;
    if (entry.regex.test(description) && !seenTypes.has(entry.pattern.type)) {
      seenTypes.add(entry.pattern.type);
      matched.push(entry.pattern);
    }
  }

  return matched;
}

function matchPlatformPatterns(description: string): readonly PlatformPattern[] {
  const matched: PlatformPattern[] = [];
  const seenPlatforms = new Set<string>();

  for (const entry of PLATFORM_PATTERNS) {
    if (entry.kind !== 'platform') continue;
    if (entry.regex.test(description) && !seenPlatforms.has(entry.pattern.platform)) {
      seenPlatforms.add(entry.pattern.platform);
      matched.push(entry.pattern);
    }
  }

  return matched;
}

function resolveAgent(
  patternAgent: string,
  platforms: readonly PlatformPattern[],
  availableAgents: readonly string[],
): string {
  // If a platform-specific agent matches, use it
  if (platforms.length > 0 && patternAgent === 'ops-operator') {
    return platforms[0].agent;
  }

  // If the pattern agent exists in available agents, use it directly
  if (availableAgents.includes(patternAgent)) {
    return patternAgent;
  }

  // Try to find a matching available agent by suffix
  const match = availableAgents.find((a) => a.endsWith(patternAgent));
  if (match) return match;

  return patternAgent;
}

function inferWorkflowName(description: string, platforms: readonly PlatformPattern[]): string {
  if (platforms.length > 0) {
    const platformNames = platforms.map((p) => p.platform).join('+');
    return `${platformNames}-workflow`;
  }
  // Extract first meaningful phrase (up to 20 chars)
  const cleaned = description.replace(/[，。！？\s]+/g, '-').slice(0, 20).replace(/-+$/, '');
  return cleaned || 'generated-workflow';
}

// --- Node/Edge builders ---

interface NodeSpec {
  readonly id: string;
  readonly agent: string;
  readonly task: string;
  readonly checkpoint: boolean;
  readonly level: number;
}

function buildNode(spec: NodeSpec, siblingIndex: number, totalSiblings: number): Node<DagNodeData> {
  const xSpacing = 320;
  const ySpacing = 200;

  return {
    id: spec.id,
    type: 'dagNode',
    position: {
      x: xSpacing * siblingIndex - (xSpacing / 2) * (totalSiblings - 1),
      y: ySpacing * spec.level,
    },
    data: {
      label: spec.id,
      agent: spec.agent,
      task: spec.task,
      checkpoint: spec.checkpoint,
      nodeId: spec.id,
      skills: [],
      mcpServers: [],
    },
  };
}

function buildDispatchEdge(source: string, target: string): Edge {
  return {
    id: `dispatch:${source}->${target}`,
    source,
    target,
    sourceHandle: 'bottom',
    targetHandle: 'top',
    animated: true,
    style: DISPATCH_EDGE_STYLE,
    data: { edgeType: 'dispatch' },
  };
}

// --- Main generator ---

export function generateWorkflow(input: GeneratorInput): GeneratedWorkflow {
  const { description, availableAgents } = input;

  const taskMatches = matchTaskPatterns(description);
  const platformMatches = matchPlatformPatterns(description);

  const workflowName = inferWorkflowName(description, platformMatches);
  const existingIds = new Set<string>(['user', 'coordinator']);

  // Level 0: User (protected)
  // Level 1: Coordinator (protected)
  // Level 2+: Generated task nodes
  // Last level: Checkpoint nodes (review/publish gates)

  const nodeSpecs: NodeSpec[] = [];
  const parallelSpecs: NodeSpec[] = [];
  const sequentialSpecs: NodeSpec[] = [];

  // Classify tasks into parallel (independent) and sequential (ordered) groups
  for (const taskMatch of taskMatches) {
    const isSequential = taskMatch.type === 'content' || taskMatch.type === 'deploy';

    for (const task of taskMatch.tasks) {
      const agent = resolveAgent(taskMatch.agents[0], platformMatches, availableAgents);
      const nodeId = generateNodeId(task.replace(/[^a-zA-Z0-9\u4e00-\u9fff-]/g, '-'), existingIds);
      existingIds.add(nodeId);

      const spec: NodeSpec = {
        id: nodeId,
        agent,
        task,
        checkpoint: false,
        level: 0, // will be computed below
      };

      if (isSequential) {
        sequentialSpecs.push(spec);
      } else {
        parallelSpecs.push(spec);
      }
    }
  }

  // If no patterns matched, create a single generic task node
  if (parallelSpecs.length === 0 && sequentialSpecs.length === 0) {
    const agent = platformMatches.length > 0
      ? platformMatches[0].agent
      : (availableAgents[0] ?? 'agent');
    const nodeId = generateNodeId('task', existingIds);
    existingIds.add(nodeId);
    parallelSpecs.push({
      id: nodeId,
      agent,
      task: description.slice(0, 100),
      checkpoint: false,
      level: 0,
    });
  }

  // Assign levels:
  // Level 0 = user, Level 1 = coordinator
  // Level 2 = parallel tasks (all at same level)
  // Level 3+ = sequential tasks (one per level after parallel)
  let currentLevel = 2;

  for (const spec of parallelSpecs) {
    nodeSpecs.push({ ...spec, level: currentLevel });
  }
  if (parallelSpecs.length > 0) {
    currentLevel += 1;
  }

  for (const spec of sequentialSpecs) {
    nodeSpecs.push({ ...spec, level: currentLevel });
    currentLevel += 1;
  }

  // Add checkpoint before publish/deploy if content or deploy patterns matched
  const hasPublishGate = taskMatches.some((t) => t.type === 'content' || t.type === 'deploy');
  if (hasPublishGate && nodeSpecs.length > 0) {
    const checkpointId = generateNodeId('review', existingIds);
    existingIds.add(checkpointId);
    // Insert checkpoint before the last sequential node
    const lastSpec = nodeSpecs[nodeSpecs.length - 1];
    const checkpointLevel = lastSpec.level;

    // Bump the last node to one level down
    const bumpedLast: NodeSpec = { ...lastSpec, level: checkpointLevel + 1 };
    const checkpoint: NodeSpec = {
      id: checkpointId,
      agent: 'coordinator',
      task: 'Review and approve',
      checkpoint: true,
      level: checkpointLevel,
    };

    // Replace last with checkpoint + bumped last
    nodeSpecs.splice(nodeSpecs.length - 1, 1, checkpoint, bumpedLast);
  }

  // Build nodes: protected nodes + generated nodes
  const protectedNodes: Node<DagNodeData>[] = [
    buildNode({ id: 'user', agent: 'user', task: 'Initiate task', checkpoint: true, level: 0 }, 0, 1),
    buildNode({ id: 'coordinator', agent: 'coordinator', task: 'Coordinate and delegate tasks', checkpoint: false, level: 1 }, 0, 1),
  ];

  // Group generated nodes by level for positioning
  const levelGroups = new Map<number, NodeSpec[]>();
  for (const spec of nodeSpecs) {
    const group = levelGroups.get(spec.level) ?? [];
    levelGroups.set(spec.level, [...group, spec]);
  }

  const generatedNodes: Node<DagNodeData>[] = [];
  for (const [, group] of levelGroups) {
    for (let i = 0; i < group.length; i++) {
      generatedNodes.push(buildNode(group[i], i, group.length));
    }
  }

  const allNodes = [...protectedNodes, ...generatedNodes];

  // Build edges
  const allEdges: Edge[] = [
    buildDispatchEdge('user', 'coordinator'),
  ];

  // Coordinator dispatches to all level-2 nodes
  const level2Nodes = nodeSpecs.filter((s) => s.level === 2);
  for (const spec of level2Nodes) {
    allEdges.push(buildDispatchEdge('coordinator', spec.id));
  }

  // Connect sequential levels: each level's nodes connect to next level's nodes
  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
  for (let i = 0; i < sortedLevels.length - 1; i++) {
    const currentGroup = levelGroups.get(sortedLevels[i]) ?? [];
    const nextGroup = levelGroups.get(sortedLevels[i + 1]) ?? [];

    // If current level is the parallel level, all parallel nodes connect to next
    if (sortedLevels[i] === 2 && currentGroup.length > 1) {
      for (const current of currentGroup) {
        for (const next of nextGroup) {
          allEdges.push(buildDispatchEdge(current.id, next.id));
        }
      }
    } else {
      // Sequential: last of current connects to first of next
      const lastCurrent = currentGroup[currentGroup.length - 1];
      const firstNext = nextGroup[0];
      if (lastCurrent && firstNext) {
        allEdges.push(buildDispatchEdge(lastCurrent.id, firstNext.id));
      }
    }
  }

  // If only level-2 nodes and no sequential, no further edges needed
  // (coordinator already dispatches to them)

  const suggestedDescription = `Auto-generated workflow: ${description.slice(0, 80)}`;

  return {
    name: workflowName,
    nodes: allNodes,
    edges: allEdges,
    suggestedDescription,
  };
}
