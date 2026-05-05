import { invoke } from '@tauri-apps/api/core'

import type { ShellResult } from './toolLifecycle.ts'

export async function runShell(command: string): Promise<ShellResult> {
  return invoke<ShellResult>('run_shell', { command })
}
