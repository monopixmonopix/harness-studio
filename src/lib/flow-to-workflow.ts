import type { Node, Edge } from '@xyflow/react';
import type { Workflow, WorkflowNode } from '@/types/resources';
import type { DagNodeData, EdgeType } from './workflow-to-flow';
import { ensureStringArray } from './array-utils';

function getEdgeType(edge: Edge): EdgeType {
  return (edge.data?.edgeType as EdgeType) ?? 'dispatch';
}

/**
 * Converts React Flow nodes + edges back into a Workflow object.
 * Reverse of workflow-to-flow.ts.
 */
export function flowToWorkflow(
  name: string,
  description: string,
  nodes: readonly Node<DagNodeData>[],
  edges: readonly Edge[]
): Workflow {
  // Filter out sticky notes — they are visual-only and not part of the workflow YAML
  const dagNodes = nodes.filter((node) => node.type !== 'stickyNote');
  const workflowNodes: readonly WorkflowNode[] = dagNodes.map((node) => {
    const dispatchEdges = edges.filter(
      (e) => e.target === node.id && getEdgeType(e) === 'dispatch'
    );
    const reportEdges = edges.filter(
      (e) => e.source === node.id && getEdgeType(e) === 'report'
    );
    const syncEdges = edges.filter(
      (e) => e.source === node.id && getEdgeType(e) === 'sync'
    );
    const roundtripEdges = edges.filter(
      (e) => e.target === node.id && getEdgeType(e) === 'roundtrip'
    );
    const dependsOn = dispatchEdges.map((e) => e.source);
    const reportsTo = reportEdges.map((e) => e.target);
    const syncsWith = syncEdges.map((e) => e.target);
    const roundtrip = roundtripEdges.map((e) => e.source);

    const base: WorkflowNode = {
      id: node.id,
      agent: node.data.agent,
      task: node.data.task,
      ...(dependsOn.length > 0 ? { depends_on: dependsOn } : {}),
      ...(reportsTo.length > 0 ? { reports_to: reportsTo } : {}),
      ...(syncsWith.length > 0 ? { syncs_with: syncsWith } : {}),
      ...(roundtrip.length > 0 ? { roundtrip } : {}),
      ...(node.data.checkpoint ? { checkpoint: true } : {}),
      ...(node.data.skills && node.data.skills.length > 0 ? { skills: [...node.data.skills] } : {}),
      ...(node.data.mcpServers && node.data.mcpServers.length > 0 ? { mcp_servers: [...node.data.mcpServers] } : {}),
    };

    return base;
  });

  return {
    name,
    description,
    version: 1,
    nodes: workflowNodes,
  };
}

/**
 * Serializes a Workflow object to YAML string format.
 */
export function workflowToYaml(workflow: Workflow): string {
  // Use js-yaml on client is not ideal; we'll serialize manually
  // to avoid importing js-yaml in client bundle.
  // Instead, return a JSON-compatible object for the API to serialize.
  const lines: string[] = [];
  lines.push(`name: ${workflow.name}`);
  if (workflow.description) {
    lines.push(`description: "${workflow.description}"`);
  }
  lines.push(`version: ${workflow.version}`);
  lines.push('nodes:');

  for (const node of workflow.nodes) {
    lines.push(`  - id: ${node.id}`);
    lines.push(`    agent: ${node.agent}`);
    lines.push(`    task: "${node.task}"`);
    const dependsOn = ensureStringArray(node.depends_on);
    if (dependsOn.length > 0) {
      lines.push('    depends_on:');
      for (const dep of dependsOn) {
        lines.push(`      - ${dep}`);
      }
    }
    const reportsTo = ensureStringArray(node.reports_to);
    if (reportsTo.length > 0) {
      lines.push('    reports_to:');
      for (const target of reportsTo) {
        lines.push(`      - ${target}`);
      }
    }
    const syncsWith = ensureStringArray(node.syncs_with);
    if (syncsWith.length > 0) {
      lines.push('    syncs_with:');
      for (const peer of syncsWith) {
        lines.push(`      - ${peer}`);
      }
    }
    const roundtripArr = ensureStringArray(node.roundtrip);
    if (roundtripArr.length > 0) {
      lines.push('    roundtrip:');
      for (const target of roundtripArr) {
        lines.push(`      - ${target}`);
      }
    }
    if (node.checkpoint) {
      lines.push('    checkpoint: true');
    }
    const skills = ensureStringArray(node.skills);
    if (skills.length > 0) {
      lines.push('    skills:');
      for (const skill of skills) {
        lines.push(`      - ${skill}`);
      }
    }
    const mcpServers = ensureStringArray(node.mcp_servers);
    if (mcpServers.length > 0) {
      lines.push('    mcp_servers:');
      for (const mcp of mcpServers) {
        lines.push(`      - ${mcp}`);
      }
    }
  }

  return lines.join('\n') + '\n';
}
