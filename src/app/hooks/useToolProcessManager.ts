import { useEffect, useState } from 'react'

import { runShell } from '@/lib/shell'
import {
  detectTool,
  expandInstallQueue,
  runToolAction,
  type ProcessType,
  type ShellRunner,
} from '@/lib/toolLifecycle'
import {
  createInitialTools,
  getToolSelectionState,
  isToolInstalled,
  toggleToolSelection,
  type Tool,
  type ToolId,
  type ToolStatus,
} from '@/lib/tools'

export type { ProcessType } from '@/lib/toolLifecycle'

interface PendingProcess {
  type: ProcessType
  queue: ToolId[]
  toolsAtStart: Tool[]
}

export function useToolProcessManager(runCommand: ShellRunner = runShell) {
  const [tools, setTools] = useState(createInitialTools)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processType, setProcessType] = useState<ProcessType | null>(null)
  const [taskQueue, setTaskQueue] = useState<ToolId[]>([])
  const [pendingTasks, setPendingTasks] = useState<ToolId[]>([])
  const [completedTasks, setCompletedTasks] = useState<ToolId[]>([])
  const [failedTasks, setFailedTasks] = useState<ToolId[]>([])
  const [pendingProcess, setPendingProcess] = useState<PendingProcess | null>(null)
  const [dots, setDots] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function refreshInitialTools() {
      setTools((current) => current.map((tool) => ({
        ...tool,
        status: 'checking',
        version: null,
      })))

      const results = await Promise.all(
        createInitialTools().map(async (tool) => [tool.id, await detectTool(tool, runCommand)] as const),
      )

      if (!isCurrent) return

      setTools((current) => current.map((tool) => {
        const result = results.find(([id]) => id === tool.id)?.[1]

        return result
          ? { ...tool, status: result.status, version: result.version }
          : tool
      }))
    }

    void refreshInitialTools()

    return () => {
      isCurrent = false
    }
  }, [runCommand])

  useEffect(() => {
    if (!isProcessing) return

    const intervalId = window.setInterval(() => {
      setDots((value) => (value.length >= 3 ? '' : `${value}.`))
    }, 400)

    return () => window.clearInterval(intervalId)
  }, [isProcessing])

  useEffect(() => {
    if (!pendingProcess) return

    let isCancelled = false
    const frameId = window.requestAnimationFrame(() => {
      if (isCancelled) return

      void runProcess(
        pendingProcess.type,
        pendingProcess.queue,
        pendingProcess.toolsAtStart,
        runCommand,
      )
    })

    return () => {
      isCancelled = true
      window.cancelAnimationFrame(frameId)
    }
  }, [pendingProcess, runCommand])

  const handleToolToggle = (id: ToolId) => {
    if (isProcessing) return
    setTools((current) => toggleToolSelection(current, id))
  }

  const startProcess = (type: ProcessType) => {
    if (isProcessing) return

    const selectedIds = tools
      .filter((tool) => tool.selected && (type === 'install' ? !isToolInstalled(tool) : isToolInstalled(tool)))
      .map((tool) => tool.id)
    const nextQueue = type === 'install'
      ? expandInstallQueue(selectedIds, tools, tools)
      : selectedIds

    if (nextQueue.length === 0) return

    setIsProcessing(true)
    setProcessType(type)
    setTaskQueue(nextQueue)
    setPendingTasks(nextQueue)
    setCompletedTasks([])
    setFailedTasks([])
    setDots('')
    setPendingProcess({
      type,
      queue: nextQueue,
      toolsAtStart: tools,
    })
  }

  async function runProcess(
    type: ProcessType,
    nextQueue: ToolId[],
    toolsAtStart: Tool[],
    commandRunner: ShellRunner,
  ) {
    setPendingProcess(null)

    for (const toolId of nextQueue) {
      const tool = toolsAtStart.find((item) => item.id === toolId)
      if (!tool) continue

      setTools((current) => updateToolState(current, toolId, 'processing', null))

      const result = await runToolAction(tool, type, commandRunner)
      const expectedStatus: ToolStatus = type === 'install' ? 'installed' : 'missing'
      const didFinish = result.status === expectedStatus

      setPendingTasks((current) => current.slice(1))
      setTools((current) => updateToolState(
        current,
        toolId,
        didFinish ? result.status : 'failed',
        didFinish ? result.version : null,
        false,
      ))

      if (didFinish) {
        setCompletedTasks((current) => [...current, toolId])
      } else {
        setFailedTasks((current) => [...current, toolId])
      }
    }

    window.setTimeout(() => {
      setIsProcessing(false)
      setProcessType(null)
      setTaskQueue([])
      setCompletedTasks([])
      setFailedTasks([])
      setPendingTasks([])
      setDots('')
    }, 2000)
  }

  const {
    canInstall,
    canUninstall,
    selectedInstalledCount,
    selectedMissingCount,
  } = getToolSelectionState(tools)

  return {
    tools,
    isProcessing,
    processType,
    taskQueue,
    pendingTasks,
    completedTasks,
    failedTasks,
    dots,
    canInstall,
    canUninstall,
    installText: canInstall ? `Install (${selectedMissingCount})` : 'Install',
    removeText: canUninstall ? `Remove (${selectedInstalledCount})` : 'Remove',
    handleToolToggle,
    startProcess,
  }
}

function updateToolState(
  tools: Tool[],
  toolId: ToolId,
  status: ToolStatus,
  version: string | null,
  selected?: boolean,
) {
  return tools.map((tool) => (
    tool.id === toolId
      ? { ...tool, status, version, selected: selected ?? tool.selected }
      : tool
  ))
}
