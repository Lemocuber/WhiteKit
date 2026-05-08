import { useEffect, useState } from 'react'

import { runShell } from '@/lib/shell'
import {
  detectTool,
  expandInstallQueue,
  resolveToolActionState,
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
  const [isProcessViewOpen, setIsProcessViewOpen] = useState(false)
  const [isRunningProcess, setIsRunningProcess] = useState(false)
  const [processType, setProcessType] = useState<ProcessType | null>(null)
  const [taskQueue, setTaskQueue] = useState<ToolId[]>([])
  const [pendingTasks, setPendingTasks] = useState<ToolId[]>([])
  const [completedTasks, setCompletedTasks] = useState<ToolId[]>([])
  const [failedTasks, setFailedTasks] = useState<ToolId[]>([])
  const [pendingProcess, setPendingProcess] = useState<PendingProcess | null>(null)
  const [dots, setDots] = useState('')

  async function runProcess(
    type: ProcessType,
    nextQueue: ToolId[],
    toolsAtStart: Tool[],
    commandRunner: ShellRunner,
  ) {
    setPendingProcess(null)

    for (const toolId of nextQueue) {
      const tool = toolsAtStart.find((item) => item.id === toolId)
      if (!tool) {
        setPendingTasks((current) => current.slice(1))
        setFailedTasks((current) => [...current, toolId])
        continue
      }

      setTools((current) => updateToolState(current, toolId, 'processing', null))

      const result = await runToolAction(tool, type, commandRunner)
      const expectedStatus: ToolStatus = type === 'install' ? 'installed' : 'missing'
      const nextState = resolveToolActionState(result, tool, type)
      const didFinish = nextState.status === expectedStatus

      setPendingTasks((current) => current.slice(1))
      setTools((current) => updateToolState(
        current,
        toolId,
        nextState.status,
        nextState.version,
        false,
      ))

      if (didFinish) {
        setCompletedTasks((current) => [...current, toolId])
      } else {
        setFailedTasks((current) => [...current, toolId])
      }
    }

    setIsRunningProcess(false)
    setDots('')
  }

  useEffect(() => {
    let isCurrent = true

    async function refreshInitialTools() {
      setTools((current) => current.map((tool) => ({
        ...tool,
        status: 'checking',
        version: null,
      })))

      createInitialTools().forEach((tool) => {
        void detectTool(tool, runCommand).then((result) => {
          if (!isCurrent) return
          setTools((current) => updateToolState(current, tool.id, result.status, result.version))
        })
      })
    }

    void refreshInitialTools()

    return () => {
      isCurrent = false
    }
  }, [runCommand])

  useEffect(() => {
    if (!isRunningProcess) return

    const intervalId = window.setInterval(() => {
      setDots((value) => (value.length >= 3 ? '' : `${value}.`))
    }, 400)

    return () => window.clearInterval(intervalId)
  }, [isRunningProcess])

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
    if (isProcessViewOpen) return
    setTools((current) => toggleToolSelection(current, id))
  }

  const startProcess = (type: ProcessType) => {
    if (isProcessViewOpen) return

    const selectedIds = tools
      .filter((tool) => tool.selected && (type === 'install' ? !isToolInstalled(tool) : isToolInstalled(tool)))
      .map((tool) => tool.id)
    const nextQueue = type === 'install'
      ? expandInstallQueue(selectedIds, tools, tools)
      : selectedIds

    if (nextQueue.length === 0) return

    setIsProcessViewOpen(true)
    setIsRunningProcess(true)
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

  const dismissProcessView = () => {
    if (!isProcessViewOpen || isRunningProcess) return

    setIsProcessViewOpen(false)
    setIsRunningProcess(false)
    setProcessType(null)
    setTaskQueue([])
    setCompletedTasks([])
    setFailedTasks([])
    setPendingTasks([])
    setPendingProcess(null)
    setDots('')
  }

  const {
    canInstall,
    canUninstall,
    selectedInstalledCount,
    selectedMissingCount,
  } = getToolSelectionState(tools)

  return {
    tools,
    isProcessViewOpen,
    isRunningProcess,
    processType,
    taskQueue,
    pendingTasks,
    completedTasks,
    failedTasks,
    isProcessComplete: isProcessViewOpen
      && !isRunningProcess
      && taskQueue.length > 0
      && completedTasks.length + failedTasks.length === taskQueue.length,
    dots,
    canInstall,
    canUninstall,
    installText: canInstall ? `安装 (${selectedMissingCount})` : '安装',
    removeText: canUninstall ? `移除 (${selectedInstalledCount})` : '移除',
    handleToolToggle,
    startProcess,
    dismissProcessView,
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
