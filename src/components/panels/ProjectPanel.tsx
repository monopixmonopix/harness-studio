'use client';

import { useState, useCallback } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { Project, Resource, Workflow } from '@/types/resources';
import type { RecentProject } from '@/lib/use-projects';
import { ProjectSelector } from './ProjectSelector';
import { AuxiliarySection } from './AuxiliarySection';
import { CommunityLinks } from './CommunityLinks';
import { CollapsibleSection, StaticSectionHeader } from './SectionHeader';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow-templates';

interface ProjectPanelProps {
  readonly activeProject: Project | null;
  readonly activeProjectLoading: boolean;
  readonly recentProjects: readonly RecentProject[];
  readonly auxiliaryResources: readonly Resource[];
  readonly mcpServerNames?: readonly string[];
  readonly selectedId: string | null;
  readonly onOpenProject: () => void;
  readonly onNewProject: () => void;
  readonly onCloseProject: () => void;
  readonly onSelectRecent: (path: string) => void;
  readonly onRemoveRecent: (path: string) => void;
  readonly onSelectResource: (resource: Resource) => void;
  readonly onSelectClaudeMd: (project: Project) => void;
  readonly onCreateWorkflow: (project: Project, template?: Workflow) => void;
  readonly onCreateAgent?: () => void;
  readonly onDeleteAgent?: (agent: Resource) => void;
  readonly onCreateSkill?: () => void;
  readonly onDeleteSkill?: (skill: Resource) => void;
  readonly onOpenClaudeConfig?: () => void;
}

export function ProjectPanel({
  activeProject,
  activeProjectLoading,
  recentProjects,
  auxiliaryResources,
  mcpServerNames = [],
  selectedId,
  onOpenProject,
  onNewProject,
  onCloseProject,
  onSelectRecent,
  onRemoveRecent,
  onSelectResource,
  onSelectClaudeMd,
  onCreateWorkflow,
  onCreateAgent,
  onDeleteAgent,
  onCreateSkill,
  onDeleteSkill,
  onOpenClaudeConfig,
}: ProjectPanelProps) {
  return (
    <nav className="flex h-full flex-col">
      {/* Project selector */}
      <ProjectSelector
        activeProject={activeProject}
        recentProjects={recentProjects}
        onOpenProject={onOpenProject}
        onNewProject={onNewProject}
        onCloseProject={onCloseProject}
        onSelectRecent={onSelectRecent}
        onRemoveRecent={onRemoveRecent}
        loading={activeProjectLoading}
      />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {activeProjectLoading && (
          <div className="flex items-center justify-center py-8">
            <span className="text-xs text-muted">Loading project...</span>
          </div>
        )}

        {!activeProjectLoading && !activeProject && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-xs text-muted">
              Open a project to get started
            </span>
          </div>
        )}

        {!activeProjectLoading && activeProject && (
          <ActiveProjectContent
            project={activeProject}
            selectedId={selectedId}
            onSelectResource={onSelectResource}
            onCreateWorkflow={onCreateWorkflow}
            onCreateAgent={onCreateAgent}
            onDeleteAgent={onDeleteAgent}
            onCreateSkill={onCreateSkill}
            onDeleteSkill={onDeleteSkill}
          />
        )}

        {/* Auxiliary sections */}
        <AuxiliarySection
          resources={auxiliaryResources}
          selectedId={selectedId}
          onSelect={onSelectResource}
          mcpServerNames={mcpServerNames}
        />

        {/* Claude Config */}
        {onOpenClaudeConfig && (
          <ClaudeConfigSection onOpen={onOpenClaudeConfig} />
        )}

        {/* CLAUDE.md at the bottom */}
        {!activeProjectLoading && activeProject && activeProject.claudeMd !== undefined && (
          <ClaudeMdSection
            project={activeProject}
            selectedId={selectedId}
            onSelectClaudeMd={onSelectClaudeMd}
          />
        )}

        {/* Community links */}
        <CommunityLinks />
      </div>
    </nav>
  );
}

interface ActiveProjectContentProps {
  readonly project: Project;
  readonly selectedId: string | null;
  readonly onSelectResource: (resource: Resource) => void;
  readonly onCreateWorkflow: (project: Project, template?: Workflow) => void;
  readonly onCreateAgent?: () => void;
  readonly onDeleteAgent?: (agent: Resource) => void;
  readonly onCreateSkill?: () => void;
  readonly onDeleteSkill?: (skill: Resource) => void;
}

function ActiveProjectContent({
  project,
  selectedId,
  onSelectResource,
  onCreateWorkflow,
  onCreateAgent,
  onDeleteAgent,
  onCreateSkill,
  onDeleteSkill,
}: ActiveProjectContentProps) {
  return (
    <div>
      {/* Agents section */}
      <AgentsSection
        agents={project.agents}
        selectedId={selectedId}
        onSelectResource={onSelectResource}
        onCreateAgent={onCreateAgent}
        onDeleteAgent={onDeleteAgent}
      />

      {/* Skills section */}
      <SkillsSection
        skills={project.skills}
        selectedId={selectedId}
        onSelectResource={onSelectResource}
        onCreateSkill={onCreateSkill}
        onDeleteSkill={onDeleteSkill}
      />

      {/* Workflows section */}
      <WorkflowsSection
        project={project}
        workflows={project.workflows}
        selectedId={selectedId}
        onSelectResource={onSelectResource}
        onCreateWorkflow={onCreateWorkflow}
      />
    </div>
  );
}

interface ClaudeMdSectionProps {
  readonly project: Project;
  readonly selectedId: string | null;
  readonly onSelectClaudeMd: (project: Project) => void;
}

function ClaudeMdSection({ project, selectedId, onSelectClaudeMd }: ClaudeMdSectionProps) {
  const claudeMdId = `${project.id}:CLAUDE.md`;

  return (
    <div className="mt-1.5">
      <button
        onClick={() => onSelectClaudeMd(project)}
        className={`w-full text-left transition-colors ${
          selectedId === claudeMdId
            ? 'bg-accent/15'
            : 'hover:bg-surface-hover'
        }`}
      >
        <StaticSectionHeader label="CLAUDE.md" />
      </button>
    </div>
  );
}

interface AgentsSectionProps {
  readonly agents: readonly Resource[];
  readonly selectedId: string | null;
  readonly onSelectResource: (resource: Resource) => void;
  readonly onCreateAgent?: () => void;
  readonly onDeleteAgent?: (agent: Resource) => void;
}

function AgentsSection({ agents, selectedId, onSelectResource, onCreateAgent, onDeleteAgent }: AgentsSectionProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, item: Resource) => {
      event.dataTransfer.setData(
        'application/cc-agent',
        JSON.stringify({ agent: item.name, agentId: item.id })
      );
      event.dataTransfer.effectAllowed = 'copy';
    },
    []
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, agent: Resource) => {
      e.stopPropagation();
      setConfirmDeleteId(agent.id);
    },
    [],
  );

  const handleConfirmDelete = useCallback(
    (e: React.MouseEvent, agent: Resource) => {
      e.stopPropagation();
      onDeleteAgent?.(agent);
      setConfirmDeleteId(null);
    },
    [onDeleteAgent],
  );

  const handleCancelDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setConfirmDeleteId(null);
    },
    [],
  );

  return (
    <CollapsibleSection label="Agents" count={agents.length}>
      {agents.length > 0 ? (
        <ul className="flex flex-col">
          {agents.map((agent) => (
            <li key={agent.id}>
              {confirmDeleteId === agent.id ? (
                <div className="flex items-center gap-1 px-3 py-0.5">
                  <span className="text-[10px] text-red-400">Delete?</span>
                  <button
                    onClick={(e) => handleConfirmDelete(e, agent)}
                    className="rounded px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-500/20"
                  >
                    Yes
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="rounded px-1.5 py-0.5 text-[10px] text-muted hover:bg-surface-hover"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, agent)}
                  onClick={() => onSelectResource(agent)}
                  className={`group w-full rounded px-3 py-0.5 text-left text-xs transition-colors cursor-grab active:cursor-grabbing ${
                    selectedId === agent.id
                      ? 'bg-accent/20 text-accent font-medium'
                      : 'text-foreground/70 hover:bg-surface-hover'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <GripVertical size={10} className="text-muted/0 group-hover:text-muted/50 transition-colors" />
                    <span className="flex-1 truncate">{agent.name}</span>
                    {onDeleteAgent && (
                      <Trash2
                        size={10}
                        className="shrink-0 text-muted/0 group-hover:text-muted/50 hover:!text-red-400 transition-colors"
                        onClick={(e) => handleDeleteClick(e, agent)}
                      />
                    )}
                  </span>
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-3 py-1 text-[10px] text-muted/60">No agents</p>
      )}
      {onCreateAgent && (
        <button
          onClick={onCreateAgent}
          className="w-full rounded px-3 py-0.5 text-left text-xs text-accent/70 hover:bg-surface-hover hover:text-accent transition-colors mt-0.5"
        >
          <span className="flex items-center gap-1"><Plus size={12} /> New Agent</span>
        </button>
      )}
    </CollapsibleSection>
  );
}

interface SkillsSectionProps {
  readonly skills: readonly Resource[];
  readonly selectedId: string | null;
  readonly onSelectResource: (resource: Resource) => void;
  readonly onCreateSkill?: () => void;
  readonly onDeleteSkill?: (skill: Resource) => void;
}

function SkillsSection({ skills, selectedId, onSelectResource, onCreateSkill, onDeleteSkill }: SkillsSectionProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, item: Resource) => {
      event.dataTransfer.setData(
        'application/cc-skill',
        JSON.stringify({ name: item.name }),
      );
      event.dataTransfer.effectAllowed = 'copy';
    },
    []
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, skill: Resource) => {
      e.stopPropagation();
      setConfirmDeleteId(skill.id);
    },
    [],
  );

  const handleConfirmDelete = useCallback(
    (e: React.MouseEvent, skill: Resource) => {
      e.stopPropagation();
      onDeleteSkill?.(skill);
      setConfirmDeleteId(null);
    },
    [onDeleteSkill],
  );

  const handleCancelDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setConfirmDeleteId(null);
    },
    [],
  );

  return (
    <CollapsibleSection label="Skills" count={skills.length}>
      {skills.length > 0 ? (
        <ul className="flex flex-col">
          {skills.map((skill) => (
            <li key={skill.id}>
              {confirmDeleteId === skill.id ? (
                <div className="flex items-center gap-1 px-3 py-0.5">
                  <span className="text-[10px] text-red-400">Delete?</span>
                  <button
                    onClick={(e) => handleConfirmDelete(e, skill)}
                    className="rounded px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-500/20"
                  >
                    Yes
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="rounded px-1.5 py-0.5 text-[10px] text-muted hover:bg-surface-hover"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, skill)}
                  onClick={() => onSelectResource(skill)}
                  className={`group w-full rounded px-3 py-0.5 text-left text-xs transition-colors cursor-grab active:cursor-grabbing ${
                    selectedId === skill.id
                      ? 'bg-accent/20 text-accent font-medium'
                      : 'text-foreground/70 hover:bg-surface-hover'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <GripVertical size={10} className="text-muted/0 group-hover:text-muted/50 transition-colors" />
                    <span className="flex-1 truncate">{skill.name}</span>
                    {onDeleteSkill && (
                      <Trash2
                        size={10}
                        className="shrink-0 text-muted/0 group-hover:text-muted/50 hover:!text-red-400 transition-colors"
                        onClick={(e) => handleDeleteClick(e, skill)}
                      />
                    )}
                  </span>
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-3 py-1 text-[10px] text-muted/60">No skills</p>
      )}
      {onCreateSkill && (
        <button
          onClick={onCreateSkill}
          className="w-full rounded px-3 py-0.5 text-left text-xs text-accent/70 hover:bg-surface-hover hover:text-accent transition-colors mt-0.5"
        >
          <span className="flex items-center gap-1"><Plus size={12} /> New Skill</span>
        </button>
      )}
    </CollapsibleSection>
  );
}

interface WorkflowsSectionProps {
  readonly project: Project;
  readonly workflows: readonly Resource[];
  readonly selectedId: string | null;
  readonly onSelectResource: (resource: Resource) => void;
  readonly onCreateWorkflow: (project: Project, template?: Workflow) => void;
}

function WorkflowsSection({
  project,
  workflows,
  selectedId,
  onSelectResource,
  onCreateWorkflow,
}: WorkflowsSectionProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  const handleNewBlank = useCallback(() => {
    onCreateWorkflow(project);
    setShowTemplates(false);
  }, [project, onCreateWorkflow]);

  const handleNewFromTemplate = useCallback((template: Workflow) => {
    onCreateWorkflow(project, template);
    setShowTemplates(false);
  }, [project, onCreateWorkflow]);

  return (
    <CollapsibleSection label="Workflows" count={workflows.length}>
      {workflows.length > 0 && (
        <ul className="flex flex-col">
          {workflows.map((wf) => (
            <li key={wf.id}>
              <button
                onClick={() => onSelectResource(wf)}
                className={`w-full rounded px-3 py-0.5 text-left text-xs transition-colors ${
                  selectedId === wf.id
                    ? 'bg-accent/20 text-accent font-medium'
                    : 'text-foreground/70 hover:bg-surface-hover'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span className="inline-block w-[10px]" />
                  <span className="truncate">{wf.name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative mt-0.5">
        <button
          onClick={() => setShowTemplates((prev) => !prev)}
          className="w-full rounded px-3 py-0.5 text-left text-xs text-accent/70 hover:bg-surface-hover hover:text-accent transition-colors"
        >
          <span className="flex items-center gap-1"><Plus size={12} /> New Workflow</span>
        </button>
        {showTemplates && (
          <div className="absolute left-0 z-10 mt-0.5 w-full rounded border border-border bg-surface shadow-lg">
            <button
              onClick={handleNewBlank}
              className="w-full px-3 py-1.5 text-left text-xs text-foreground/70 hover:bg-surface-hover"
            >
              Blank
            </button>
            <div className="border-t border-border">
              <p className="px-3 py-1 text-[9px] uppercase tracking-wider text-muted">Templates</p>
              {WORKFLOW_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => handleNewFromTemplate(tpl.workflow)}
                  className="w-full px-3 py-1 text-left hover:bg-surface-hover"
                >
                  <span className="block text-xs text-foreground/70">{tpl.name}</span>
                  <span className="block text-[10px] text-muted/60">{tpl.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

interface ClaudeConfigSectionProps {
  readonly onOpen: () => void;
}

function ClaudeConfigSection({ onOpen }: ClaudeConfigSectionProps) {
  return (
    <div className="mt-1.5">
      <button
        onClick={onOpen}
        className="w-full text-left transition-colors hover:bg-surface-hover"
      >
        <StaticSectionHeader label="Claude Config" />
      </button>
    </div>
  );
}
