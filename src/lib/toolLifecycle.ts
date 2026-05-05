import { createToolCatalog, type ToolCatalogEntry, type ToolId, type ToolStatus } from './toolCatalog.ts'

export interface ShellResult {
  stdout: string
  stderr: string
  exitCode: number
}

export type ShellRunner = (command: string) => Promise<ShellResult>
export type ProcessType = 'install' | 'remove'

export interface ToolLifecycleState {
  id: ToolId
  status: ToolStatus
}

export interface ToolDetectionResult {
  status: Extract<ToolStatus, 'installed' | 'missing' | 'failed'>
  version: string | null
}

export function parseToolVersion(output: string, versionRegex: string): string | null {
  return new RegExp(versionRegex).exec(output)?.[0] ?? null
}

export function expandInstallQueue(
  selectedIds: ToolId[],
  tools: ToolLifecycleState[],
  catalog: ToolCatalogEntry[] = createToolCatalog(),
): ToolId[] {
  const catalogById = new Map(catalog.map((tool) => [tool.id, tool]))
  const stateById = new Map(tools.map((tool) => [tool.id, tool]))
  const queued = new Set<ToolId>()
  const visiting = new Set<ToolId>()
  const queue: ToolId[] = []

  const isMissing = (id: ToolId) => stateById.get(id)?.status !== 'installed'

  const addTool = (id: ToolId) => {
    if (queued.has(id) || !isMissing(id)) return

    if (visiting.has(id)) {
      throw new Error(`Circular dependency detected for ${id}`)
    }

    const tool = catalogById.get(id)
    if (!tool) return

    visiting.add(id)
    tool.dependencies.forEach(addTool)
    visiting.delete(id)
    queued.add(id)
    queue.push(id)
  }

  selectedIds.forEach(addTool)
  return queue
}

export async function detectTool(tool: ToolCatalogEntry, runShell: ShellRunner): Promise<ToolDetectionResult> {
  try {
    const result = await runShell(tool.detect)
    const version = parseToolVersion(`${result.stdout}\n${result.stderr}`, tool.versionRegex)

    return version
      ? { status: 'installed', version }
      : { status: 'missing', version: null }
  } catch {
    return { status: 'failed', version: null }
  }
}

export async function runToolAction(
  tool: ToolCatalogEntry,
  processType: ProcessType,
  runShell: ShellRunner,
): Promise<ToolDetectionResult> {
  const command = processType === 'install' ? tool.install : tool.uninstall

  try {
    const result = await runShell(command)

    if (result.exitCode !== 0) {
      return { status: 'failed', version: null }
    }
  } catch {
    return { status: 'failed', version: null }
  }

  return detectTool(tool, runShell)
}
