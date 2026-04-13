[English](README.md) | [中文](README_CN.md)

# claude-studio

Visual orchestration platform for Claude Code Agent Teams.

Design, manage, and execute multi-agent workflows through an intuitive DAG editor. Create agents, skills, and workflows — then run them with built-in execution engine.

![claude-studio screenshot](docs/screenshot.png)

## Features

- 🔀 **Visual Workflow Editor** — Drag-and-drop DAG editor with 4 edge types (dispatch / report / sync / roundtrip)
- 🤖 **Agent Management** — Create, edit, delete agents with 9 built-in templates
- ⚡ **Skill Management** — Create skills with templates, bind to agent nodes
- 🚀 **Execution Engine** — Run workflows with real-time status, checkpoint approval
- 🪄 **AI Generation** — Describe what you want, Claude generates workflow/agent/skill via `claude -p`
- 🔌 **MCP & Settings** — Visual config for MCP servers, hooks, permissions
- 📦 **Plugin Export** — Export project as standard Claude Code plugin package
- 🧠 **Memory Inspector** — Read-only view of project memories with delete capability
- 🎯 **CLAUDE.md Sync** — Workflows auto-sync to CLAUDE.md for Claude Code integration
- 🌐 **Community Links** — Live GitHub stars for awesome-claude-code, agent templates, skills collections
- 🗂️ **System Directory Picker** — Native OS directory picker for opening projects
- 🌓 **Theme Switching** — Dark, Light, and System theme modes
- ↔️ **Resizable Panels** — Drag to resize the right panel
- ⚙️ **Project-level Config** — Manage shared and local Claude configuration per project
- 📐 **Project-first Layout** — Restructured left panel with project navigation priority
- 📥 **Import/Export** — Improved import with FileInput/FileOutput icons in sidebar

## Quick Start

```bash
npx claude-studio
```

Or with custom port:

```bash
npx claude-studio --port 3200
```

### Development

```bash
git clone https://github.com/androidZzT/claude-studio.git
cd claude-studio
npm install
npm run dev -- -p 3100
```

## How It Works

1. **Open or create a project** — point to any directory with `.claude/`
2. **Create agents** — from templates or AI generation
3. **Build workflow** — drag agents onto canvas, connect with edges
4. **Bind skills & MCPs** — drag from panel onto agent nodes
5. **Run** — execute with checkpoint gates
6. **Export** — save as YAML or export as Claude Code plugin

## Architecture

```
┌─────────────────────────────────┐
│  GUI (React + React Flow v12)   │
├─────────────────────────────────┤
│  Next.js API Routes             │
├─────────────────────────────────┤
│  ~/.claude/ (source of truth)   │
├─────────────────────────────────┤
│  Claude Code (runtime)          │
└─────────────────────────────────┘
```

Tech stack: Next.js · React Flow v12 · Monaco Editor · TypeScript · Tailwind CSS · Lucide Icons

## Edge Types

| Type | Visual | Purpose |
|------|--------|---------|
| Dispatch | Solid gray | Task assignment, execution dependency |
| Report | Dashed cyan | Feedback / results reporting |
| Sync | Dotted purple | Peer-to-peer collaboration |
| Roundtrip | Solid teal, double arrow | Bidirectional dispatch + report |

## License

MIT
