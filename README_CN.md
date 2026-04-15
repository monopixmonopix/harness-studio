[English](README.md) | [中文](README_CN.md)

# claude-studio

Claude Code Agent Teams 的可视化编排平台。

通过直观的 DAG 编辑器设计、管理和执行多 Agent 工作流。创建 Agent、Skill 和 Workflow，然后用内置执行引擎运行。

## 截图

<table>
  <tr>
    <td align="center"><strong>深色模式</strong></td>
    <td align="center"><strong>浅色模式</strong></td>
  </tr>
  <tr>
    <td><img src="docs/guide-dark.png" alt="深色模式" width="100%"></td>
    <td><img src="docs/guide-light.png" alt="浅色模式" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><strong>工作流 DAG</strong></td>
    <td align="center"><strong>项目工作区</strong></td>
  </tr>
  <tr>
    <td><img src="docs/workflow-dag.png" alt="工作流 DAG" width="100%"></td>
    <td><img src="docs/project-workspace.png" alt="项目工作区" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><strong>节点编辑器</strong></td>
    <td align="center"><strong>项目配置</strong></td>
  </tr>
  <tr>
    <td><img src="docs/agent-node.png" alt="节点编辑器" width="100%"></td>
    <td><img src="docs/project-settings.png" alt="项目配置" width="100%"></td>
  </tr>
</table>

## 功能特性

- 🔀 **可视化工作流编辑器** — 拖拽式 DAG 编辑，4 种边类型（指派/回报/协作/双向）
- 🤖 **Agent 管理** — 创建/编辑/删除，9 个内置模板
- ⚡ **Skill 管理** — 创建 Skill 并绑定到 Agent 节点
- 🚀 **执行引擎** — 按拓扑序执行工作流，支持 Checkpoint 审批
- 🪄 **AI 生成** — 用自然语言描述，通过 claude -p 自动生成 Workflow/Agent/Skill
- 🔌 **MCP 和设置** — 可视化管理 MCP 服务器、Hook、权限
- 📦 **Plugin 导出** — 导出为标准 Claude Code Plugin 格式
- 🧠 **记忆检视** — 只读查看项目记忆，支持清理过期记忆
- 🎯 **CLAUDE.md 同步** — 保存工作流时自动同步到 CLAUDE.md
- 🌐 **社区资源** — 实时显示热门 Claude Code 资源的 GitHub Stars

## 快速开始

```bash
npx claude-code-studio
```

自定义端口：

```bash
npx claude-code-studio --port 3200
```

### 开发模式

```bash
git clone https://github.com/androidZzT/claude-studio.git
cd claude-studio
npm install
npm run dev -- -p 3100
```

## 使用流程

1. **打开或新建项目** — 指向任何包含 .claude/ 的目录
2. **创建 Agent** — 从模板或 AI 生成
3. **编排工作流** — 拖拽 Agent 到画布，连线定义依赖
4. **绑定 Skill 和 MCP** — 从面板拖到 Agent 节点
5. **预览和执行** — 预览动画确认流程，Run 执行并审批 Checkpoint
6. **导出** — 保存为 YAML 或导出为 Plugin 包

## 架构

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

技术栈: Next.js · React Flow v12 · Monaco Editor · TypeScript · Tailwind CSS · Lucide Icons

## 边类型

| 类型 | 样式 | 用途 |
|------|------|------|
| Dispatch (指派) | 灰色实线 | 任务分配，执行依赖 |
| Report (回报) | 青色虚线 | 结果反馈 |
| Sync (协作) | 紫色点线 | 同级协作 |
| Roundtrip (双向) | 青绿双箭头 | 双向指派+回报 |

## 许可证

MIT
