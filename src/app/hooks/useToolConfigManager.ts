import { useState } from 'react'

import { runShell } from '@/lib/shell'
import {
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
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [configTarget, setConfigTarget] = useState<ToolConfigTarget | null>(null)
  const [configResult, setConfigResult] = useState<ToolConfigResult | null>(null)

  const startConfig = (target: ToolConfigTarget) => {
    if (isSavingConfig) return

    setIsConfigViewOpen(true)
    setConfigTarget(target)
    setConfigResult(null)
  }

  const cancelConfig = () => {
    if (isSavingConfig) return

    setIsConfigViewOpen(false)
    setConfigTarget(null)
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
    if (isSavingConfig || !configResult) return

    setIsConfigViewOpen(false)
    setConfigTarget(null)
    setConfigResult(null)
  }

  return {
    isConfigViewOpen,
    isSavingConfig,
    configTarget,
    configResult,
    startConfig,
    cancelConfig,
    saveConfig,
    dismissConfigResult,
  }
}
