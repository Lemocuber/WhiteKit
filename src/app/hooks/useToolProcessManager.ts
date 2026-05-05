import { useEffect, useState } from 'react'

import {
  createInitialTools,
  getToolSelectionState,
  isToolInstalled,
  toggleToolSelection,
  type Tool,
  type ToolId,
} from '@/lib/tools'

export type ProcessType = 'install' | 'remove'

export function useToolProcessManager() {
  const [tools, setTools] = useState(createInitialTools)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processType, setProcessType] = useState<ProcessType | null>(null)
  const [taskQueue, setTaskQueue] = useState<ToolId[]>([])
  const [pendingTasks, setPendingTasks] = useState<ToolId[]>([])
  const [completedTasks, setCompletedTasks] = useState<ToolId[]>([])
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isProcessing) return

    const intervalId = window.setInterval(() => {
      setDots((value) => (value.length >= 3 ? '' : `${value}.`))
    }, 400)

    return () => window.clearInterval(intervalId)
  }, [isProcessing])

  useEffect(() => {
    if (!isProcessing) return

    if (pendingTasks.length === 0) {
      const idleTimerId = window.setTimeout(() => {
        setIsProcessing(false)
        setProcessType(null)
        setTaskQueue([])
        setCompletedTasks([])
        setDots('')
      }, 2000)

      return () => window.clearTimeout(idleTimerId)
    }

    const nextTaskId = pendingTasks[0]
    const taskTimerId = window.setTimeout(() => {
      setPendingTasks((current) => current.slice(1))
      setCompletedTasks((current) => [...current, nextTaskId])
      setTools((current) => updateToolVersion(current, nextTaskId, processType))
    }, Math.random() * 1500 + 800)

    return () => window.clearTimeout(taskTimerId)
  }, [isProcessing, pendingTasks, processType])

  const handleToolToggle = (id: ToolId) => {
    if (isProcessing) return
    setTools((current) => toggleToolSelection(current, id))
  }

  const startProcess = (type: ProcessType) => {
    const nextQueue = tools
      .filter((tool) => tool.selected && (type === 'install' ? !isToolInstalled(tool) : isToolInstalled(tool)))
      .map((tool) => tool.id)

    if (nextQueue.length === 0) return

    setIsProcessing(true)
    setProcessType(type)
    setTaskQueue(nextQueue)
    setPendingTasks(nextQueue)
    setCompletedTasks([])
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
    isProcessing,
    processType,
    taskQueue,
    pendingTasks,
    completedTasks,
    dots,
    canInstall,
    canUninstall,
    installText: canInstall ? `Install (${selectedMissingCount})` : 'Install',
    removeText: canUninstall ? `Remove (${selectedInstalledCount})` : 'Remove',
    handleToolToggle,
    startProcess,
  }
}

function updateToolVersion(tools: Tool[], toolId: ToolId, processType: ProcessType | null) {
  return tools.map((tool) => (
    tool.id === toolId
      ? { ...tool, version: processType === 'install' ? 'latest' : null, selected: false }
      : tool
  ))
}
