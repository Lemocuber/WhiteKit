import claudeCodeIcon from '@/assets/tools/claude-code.svg'
import codexIcon from '@/assets/tools/codex.svg'
import gitIcon from '@/assets/tools/git.svg'
import homebrewIcon from '@/assets/tools/homebrew.svg'
import nodejsIcon from '@/assets/tools/nodejs.svg'
import pythonIcon from '@/assets/tools/python.svg'
import wingetIcon from '@/assets/tools/winget.svg'
import { createToolCatalog, type ToolCatalogEntry, type ToolId, type ToolStatus } from '@/lib/toolCatalog'

export type { ToolId, ToolStatus } from '@/lib/toolCatalog'
export type ToolFilter = 'all' | 'installed' | 'available'

interface ToolDefinition extends ToolCatalogEntry {
  iconSrc: string
  version: string | null
  status: ToolStatus
}

export interface Tool extends ToolDefinition {
  selected: boolean
}

export const toolFilterTabs: Array<{ id: ToolFilter; label: string }> = [
  { id: 'all', label: 'All Tools' },
  { id: 'installed', label: 'Installed' },
  { id: 'available', label: 'Available' },
]

const toolIcons: Record<ToolId, string> = {
  homebrew: homebrewIcon,
  winget: wingetIcon,
  nodejs: nodejsIcon,
  python: pythonIcon,
  git: gitIcon,
  claude: claudeCodeIcon,
  codex: codexIcon,
}

export function createInitialTools(): Tool[] {
  return createToolCatalog().map((tool) => ({
    ...tool,
    iconSrc: toolIcons[tool.id],
    selected: false,
    status: 'checking',
    version: null,
  }))
}

export function isToolInstalled(tool: Tool): boolean {
  return tool.status === 'installed'
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
  const hasPendingSelection = selectedTools.some((tool) => (
    tool.status === 'checking' || tool.status === 'processing'
  ))
  const canUninstall = !hasPendingSelection && selectedTools.length > 0 && selectedInstalledCount === selectedTools.length
  const canInstall = !hasPendingSelection && selectedTools.length > 0 && selectedMissingCount === selectedTools.length

  return {
    canInstall,
    canUninstall,
    selectedInstalledCount,
    selectedMissingCount,
  }
}
