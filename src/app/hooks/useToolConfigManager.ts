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

export function useToolConfigManager(runCommand: ShellRunner = runShell) {
  const [isConfigViewOpen, setIsConfigViewOpen] = useState(false)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [configTarget, setConfigTarget] = useState<ToolConfigTarget | null>(null)
  const [configInput, setConfigInput] = useState<ToolConfigInput>(emptyToolConfigInput)
  const [configError, setConfigError] = useState<string | null>(null)
  const loadIdRef = useRef(0)

  const resetConfigState = () => {
    setIsConfigViewOpen(false)
    setIsLoadingConfig(false)
    setConfigTarget(null)
    setConfigInput(emptyToolConfigInput())
    setConfigError(null)
  }

  const startConfig = (target: ToolConfigTarget) => {
    if (isLoadingConfig || isSavingConfig) return

    const loadId = loadIdRef.current + 1

    loadIdRef.current = loadId
    setIsConfigViewOpen(true)
    setIsLoadingConfig(true)
    setConfigTarget(target)
    setConfigInput(emptyToolConfigInput())
    setConfigError(null)

    void loadToolConfig(target, runCommand).then((input) => {
      if (loadId !== loadIdRef.current) return

      setConfigInput(input)
    }).catch((error: unknown) => {
      if (loadId !== loadIdRef.current) return

      setConfigError(error instanceof Error ? error.message : '配置失败')
    }).finally(() => {
      if (loadId !== loadIdRef.current) return

      setIsLoadingConfig(false)
    })
  }

  const cancelConfig = () => {
    if (isSavingConfig) return

    loadIdRef.current += 1
    resetConfigState()
  }

  const saveConfig = async (input: ToolConfigInput) => {
    if (!configTarget || isSavingConfig) return

    setIsSavingConfig(true)
    setConfigError(null)

    try {
      await saveToolConfig(configTarget, input, runCommand)
      loadIdRef.current += 1
      resetConfigState()
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : '配置失败')
    } finally {
      setIsSavingConfig(false)
    }
  }

  const dismissConfigError = () => {
    if (isLoadingConfig || isSavingConfig || !configError) return

    loadIdRef.current += 1
    resetConfigState()
  }

  return {
    isConfigViewOpen,
    isLoadingConfig,
    isSavingConfig,
    configTarget,
    configInput,
    configError,
    startConfig,
    cancelConfig,
    saveConfig,
    dismissConfigError,
  }
}
