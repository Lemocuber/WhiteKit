import { invoke } from '@tauri-apps/api/core'

import type { ShellResult } from './toolLifecycle.ts'
import { detectToolPlatform } from './toolCatalog.ts'

export async function runShell(command: string): Promise<ShellResult> {
  return invoke<ShellResult>('run_shell', { command })
}

export async function launchTerminal(): Promise<void> {
  const command = detectToolPlatform() === 'windows'
    ? '!SUDO start cmd'
    : `!SUDO osascript -e 'tell application "Terminal" to do script ""'`
  const result = await runShell(command)

  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || 'Failed to launch terminal')
  }
}
