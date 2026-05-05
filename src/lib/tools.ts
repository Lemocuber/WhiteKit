import claudeCodeIcon from '@/assets/tools/claude-code.svg'
import codexIcon from '@/assets/tools/codex.svg'
import gitIcon from '@/assets/tools/git.svg'
import nodejsIcon from '@/assets/tools/nodejs.svg'
import pythonIcon from '@/assets/tools/python.svg'

export type ToolId = 'nodejs' | 'python' | 'git' | 'claude' | 'codex'
export type ToolFilter = 'all' | 'installed' | 'available'

interface ToolDefinition {
  id: ToolId
  name: string
  iconSrc: string
  version: string | null
  description: string
}

export interface Tool extends ToolDefinition {
  selected: boolean
}

export const toolFilterTabs: Array<{ id: ToolFilter; label: string }> = [
  { id: 'all', label: 'All Tools' },
  { id: 'installed', label: 'Installed' },
  { id: 'available', label: 'Available' },
]

const toolCatalog: ToolDefinition[] = [
  {
    id: 'nodejs',
    name: 'Node.js',
    iconSrc: nodejsIcon,
    version: '20.11.0',
    description: 'JavaScript runtime for backend dev',
  },
  {
    id: 'python',
    name: 'Python',
    iconSrc: pythonIcon,
    version: '3.12.2',
    description: 'High-level programming language',
  },
  {
    id: 'git',
    name: 'Git',
    iconSrc: gitIcon,
    version: '2.44.0',
    description: 'Distributed version control system',
  },
  {
    id: 'claude',
    name: 'Claude Code',
    iconSrc: claudeCodeIcon,
    version: null,
    description: 'Anthropic CLI for agentic coding',
  },
  {
    id: 'codex',
    name: 'Codex',
    iconSrc: codexIcon,
    version: null,
    description: 'OpenAI CLI for agentic coding',
  },
]

export function createInitialTools(): Tool[] {
  return toolCatalog.map((tool) => ({ ...tool, selected: false }))
}

export function isToolInstalled(tool: Tool): boolean {
  return tool.version !== null
}

export function toggleToolSelection(tools: Tool[], id: ToolId): Tool[] {
  return tools.map((tool) => (
    tool.id === id ? { ...tool, selected: !tool.selected } : tool
  ))
}

export function getFilteredTools(tools: Tool[], filter: ToolFilter): Tool[] {
  if (filter === 'installed') {
    return tools.filter(isToolInstalled)
  }

  if (filter === 'available') {
    return tools.filter((tool) => !isToolInstalled(tool))
  }

  return tools
}

export function getToolSelectionState(tools: Tool[]) {
  const selectedTools = tools.filter((tool) => tool.selected)
  const selectedInstalledCount = selectedTools.filter(isToolInstalled).length
  const selectedMissingCount = selectedTools.length - selectedInstalledCount
  const canUninstall = selectedTools.length > 0 && selectedInstalledCount === selectedTools.length
  const canInstall = selectedTools.length > 0 && selectedMissingCount === selectedTools.length

  return {
    canInstall,
    canUninstall,
    selectedInstalledCount,
    selectedMissingCount,
  }
}
