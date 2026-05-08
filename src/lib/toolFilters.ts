import type { ToolStatus } from './toolCatalog.ts'

export type ToolFilter = 'all' | 'installed' | 'available'

type FilterableTool = { status: ToolStatus }

export function isToolInstalled<T extends FilterableTool>(tool: T): boolean {
  return tool.status === 'installed'
}

export function getFilteredTools<T extends FilterableTool>(tools: T[], filter: ToolFilter): T[] {
  if (filter === 'installed') {
    return tools.filter(isToolInstalled)
  }

  if (filter === 'available') {
    return tools.filter((tool) => !isToolInstalled(tool))
  }

  return tools
}

export function getNextToolFilter(filter: ToolFilter): ToolFilter {
  if (filter === 'all') {
    return 'installed'
  }

  if (filter === 'installed') {
    return 'available'
  }

  return 'all'
}
