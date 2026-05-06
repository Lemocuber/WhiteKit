import { useRef, useState } from 'react'

import { runShell } from '@/lib/shell'
import {
  emptyToolConfigInput,
  loadToolConfig,
  saveToolConfig,
  type ToolConfigInput,
  type ToolConfigTarget,
} from '@/lib/toolConfig'
import type { ShellRunner } from '@/lib/toolLifecycle'

interface ToolConfigResult {
  type: 'success' | 'error'
  message: string
}

export function useToolConfigManager(runCommand: ShellRunner = runShell) {
  const [isConfigViewOpen, setIsConfigViewOpen] = useState(false)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [configTarget, setConfigTarget] = useState<ToolConfigTarget | null>(null)
  const [configInput, setConfigInput] = useState<ToolConfigInput>(emptyToolConfigInput)
  const [configResult, setConfigResult] = useState<ToolConfigResult | null>(null)
  const loadIdRef = useRef(0)

  const startConfig = (target: ToolConfigTarget) => {
    if (isLoadingConfig || isSavingConfig) return

    const loadId = loadIdRef.current + 1

    loadIdRef.current = loadId
    setIsConfigViewOpen(true)
    setIsLoadingConfig(true)
    setConfigTarget(target)
    setConfigInput(emptyToolConfigInput())
    setConfigResult(null)

    void loadToolConfig(target, runCommand).then((input) => {
      if (loadId !== loadIdRef.current) return

      setConfigInput(input)
    }).catch((error: unknown) => {
      if (loadId !== loadIdRef.current) return

      setConfigResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Configuration failed',
      })
    }).finally(() => {
      if (loadId !== loadIdRef.current) return

      setIsLoadingConfig(false)
    })
  }

  const cancelConfig = () => {
    if (isSavingConfig) return

    loadIdRef.current += 1
    setIsConfigViewOpen(false)
    setIsLoadingConfig(false)
    setConfigTarget(null)
    setConfigInput(emptyToolConfigInput())
    setConfigResult(null)
  }

  const saveConfig = async (input: ToolConfigInput) => {
    if (!configTarget || isSavingConfig) return

    setIsSavingConfig(true)
    setConfigResult(null)

    try {
      await saveToolConfig(configTarget, input, runCommand)
      setConfigResult({
        type: 'success',
        message: `${configTarget === 'codex' ? 'Codex' : 'Claude Code'} configuration saved`,
      })
    } catch (error) {
      setConfigResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Configuration failed',
      })
    } finally {
      setIsSavingConfig(false)
    }
  }

  const dismissConfigResult = () => {
    if (isLoadingConfig || isSavingConfig || !configResult) return

    loadIdRef.current += 1
    setIsConfigViewOpen(false)
    setIsLoadingConfig(false)
    setConfigTarget(null)
    setConfigInput(emptyToolConfigInput())
    setConfigResult(null)
  }

  return {
    isConfigViewOpen,
    isLoadingConfig,
    isSavingConfig,
    configTarget,
    configInput,
    configResult,
    startConfig,
    cancelConfig,
    saveConfig,
    dismissConfigResult,
  }
}
