import type { Workflow } from '@/types/resources';

export interface WorkflowTemplate {
  readonly name: string;
  readonly description: string;
  readonly workflow: Workflow;
}

export const WORKFLOW_TEMPLATES: readonly WorkflowTemplate[] = [
  {
    name: 'Code Review Pipeline',
    description: 'Automated code review with security and performance checks',
    workflow: {
      name: 'Code Review Pipeline',
      description: 'Automated code review with security and performance checks',
      version: 1,
      nodes: [
        { id: 'user', agent: 'user', task: 'Submit code for review', checkpoint: true },
        { id: 'code-reviewer', agent: 'code-reviewer', task: 'Review code quality, naming, and patterns', depends_on: ['user'] },
        { id: 'security-reviewer', agent: 'security-reviewer', task: 'Check for security vulnerabilities', depends_on: ['user'] },
        { id: 'coordinator', agent: 'coordinator', task: 'Consolidate reviews and make final decision', depends_on: ['code-reviewer', 'security-reviewer'], checkpoint: true },
      ],
    },
  },
  {
    name: 'Content Publishing',
    description: 'Content creation, review, and publishing workflow',
    workflow: {
      name: 'Content Publishing',
      description: 'Content creation, review, and publishing workflow',
      version: 1,
      nodes: [
        { id: 'user', agent: 'user', task: 'Provide topic and requirements', checkpoint: true },
        { id: 'researcher', agent: 'researcher', task: 'Research topic and gather references', depends_on: ['user'] },
        { id: 'writer', agent: 'writer', task: 'Draft content based on research', depends_on: ['researcher'] },
        { id: 'editor', agent: 'editor', task: 'Review and polish draft', depends_on: ['writer'], reports_to: ['user'] },
        { id: 'publisher', agent: 'publisher', task: 'Format and publish final content', depends_on: ['editor'], checkpoint: true },
      ],
    },
  },
  {
    name: 'Bug Fix Workflow',
    description: 'TDD-based bug fix with testing and review',
    workflow: {
      name: 'Bug Fix Workflow',
      description: 'TDD-based bug fix with testing and review',
      version: 1,
      nodes: [
        { id: 'user', agent: 'user', task: 'Report bug with reproduction steps', checkpoint: true },
        { id: 'tester', agent: 'tester', task: 'Write failing test that reproduces the bug', depends_on: ['user'] },
        { id: 'developer', agent: 'developer', task: 'Implement minimal fix to pass tests', depends_on: ['tester'] },
        { id: 'reviewer', agent: 'code-reviewer', task: 'Review fix for correctness and side effects', depends_on: ['developer'] },
        { id: 'coordinator', agent: 'coordinator', task: 'Approve and merge fix', depends_on: ['reviewer'], reports_to: ['user'], checkpoint: true },
      ],
    },
  },
] as const;
