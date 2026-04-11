/**
 * Prompt templates for AI generation via `claude -p`.
 * Each function builds a self-contained prompt string for a specific resource type.
 */

export function buildWorkflowPrompt(
  description: string,
  agents: readonly string[],
  skills: readonly string[],
): string {
  const agentList = agents.length > 0 ? agents.join(', ') : '(none)';
  const skillList = skills.length > 0 ? skills.join(', ') : '(none)';

  return `You are a workflow designer for Claude Code Agent Teams.

CRITICAL CONSTRAINT — READ THIS FIRST:
The ONLY agents you may use are: user, ${agentList}
Do NOT invent, create, or hallucinate agent names that are not in this list.
Every node's "agent" field MUST be exactly one of: user, ${agentList}
If the available agents don't cover a needed role, pick the closest match from the list above.
Violating this rule makes the entire output invalid.

The ONLY skills you may reference are: ${skillList}
Do NOT invent skill names. Only add "skills:" if a matching skill exists in the list.

User's description: ${description}

Output ONLY valid YAML (no markdown fences, no explanation, no commentary):

name: Workflow Name
description: One line description
version: 1

nodes:
  - id: user
    agent: user
    task: describe what the user does
    checkpoint: true

  - id: coordinator
    agent: (MUST be one of: ${agentList})
    task: describe the coordination task
    depends_on: [user]

  - id: worker-1
    agent: (MUST be one of: ${agentList})
    task: describe the task
    depends_on: [coordinator]

Rules:
- Always start with a "user" node (checkpoint: true) and a "coordinator" node
- Use depends_on for execution order
- Use reports_to for feedback edges
- Use syncs_with for peer collaboration between same-level nodes
- Use roundtrip for bidirectional dispatch+report
- Set checkpoint: true on approval/review nodes
- Parallel tasks should depend on the same parent
- REMINDER: agent field must be exactly from: user, ${agentList}`;
}

export function buildAgentPrompt(description: string): string {
  return `Generate a Claude Code agent definition based on the user's description.

User's description: ${description}

Output ONLY valid YAML frontmatter followed by a markdown body. No markdown fences, no explanation.

Format:
name: kebab-case-name
description: one line description
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep

---
(structured system prompt in markdown with sections: Role, Responsibilities, Scope, Workflow, Output Format, Quality Standards, Stop Conditions)

Rules:
- name must be kebab-case
- model must be one of: sonnet, opus, haiku
- tools must be from: Read, Write, Edit, Bash, Glob, Grep, Agent, SendMessage
- The body after --- should be a comprehensive system prompt in markdown
- Keep the system prompt practical and focused`;
}

export function buildSkillPrompt(description: string): string {
  return `Generate a Claude Code skill definition based on the user's description.

User's description: ${description}

Output ONLY valid YAML frontmatter followed by a markdown body. No markdown fences, no explanation.

Format:
name: kebab-case-name
description: one line description

---
(skill instructions in markdown: when to use, step-by-step process, output format, examples)

Rules:
- name must be kebab-case
- The body after --- should be clear, actionable instructions
- Include specific examples where helpful
- Keep instructions focused and practical`;
}
