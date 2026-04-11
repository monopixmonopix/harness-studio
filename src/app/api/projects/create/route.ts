import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { fileExists } from '@/lib/file-ops';
import { scanProjectAtPath } from '@/lib/project-scanner';
import { getProjectTemplateAgents } from '@/lib/project-templates';
import { expandHome } from '@/lib/path-utils';
import type { ApiResponse, Project } from '@/types/resources';

type ProjectTemplate = 'blank' | 'dev-team' | 'ops-team';

interface CreateRequest {
  readonly name: string;
  readonly parentDir: string;
  readonly template: ProjectTemplate;
}

function buildClaudeMd(name: string): string {
  return [
    `# ${name}`,
    '',
    '## Overview',
    'Describe your project here.',
    '',
    '## Team',
    'Define your agent team roles.',
    '',
    '## Workflows',
    'Describe your key workflows.',
    '',
  ].join('\n');
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Project>>> {
  try {
    const body = (await request.json()) as CreateRequest;

    if (typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const parentDir = expandHome(body.parentDir || '~/Claude');
    const projectPath = path.join(parentDir, body.name.trim());

    if (await fileExists(projectPath)) {
      return NextResponse.json(
        { success: false, error: `Directory already exists: ${projectPath}` },
        { status: 409 }
      );
    }

    // Create directory structure
    await fs.mkdir(path.join(projectPath, '.claude', 'agents'), { recursive: true });
    await fs.mkdir(path.join(projectPath, '.claude', 'workflows'), { recursive: true });

    // Write CLAUDE.md
    await fs.writeFile(
      path.join(projectPath, 'CLAUDE.md'),
      buildClaudeMd(body.name.trim()),
      'utf-8'
    );

    // Write template agents
    const template: ProjectTemplate = body.template || 'blank';
    const agents = getProjectTemplateAgents(template);
    for (const agent of agents) {
      const fileContent =
        agent.frontmatter && Object.keys(agent.frontmatter).length > 0
          ? matter.stringify(agent.body, agent.frontmatter)
          : agent.body;
      await fs.writeFile(
        path.join(projectPath, '.claude', 'agents', `${agent.id}.md`),
        fileContent,
        'utf-8'
      );
    }

    const project = await scanProjectAtPath(projectPath);
    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create project';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
