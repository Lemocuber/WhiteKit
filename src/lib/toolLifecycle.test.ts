import assert from 'node:assert/strict'
import test from 'node:test'

import { createToolCatalog } from './toolCatalog.ts'
import {
  detectTool,
  expandInstallQueue,
  parseToolVersion,
  resolveToolActionState,
  runToolAction,
  type ShellResult,
} from './toolLifecycle.ts'

const catalog = createToolCatalog('macos')
const byId = new Map(catalog.map((tool) => [tool.id, tool]))

test('parseToolVersion returns the first semver-looking version', () => {
  assert.equal(parseToolVersion('Codex CLI 1.2.3\nbuild 9', String.raw`\d+\.\d+\.\d+`), '1.2.3')
  assert.equal(parseToolVersion('no version here', String.raw`\d+\.\d+\.\d+`), null)
  assert.equal(parseToolVersion('openclaw/2026.3.23-2', String.raw`\d+\.\d+\.\d+(?:-\d+)?`), '2026.3.23-2')
})

test('expandInstallQueue adds missing dependencies before selected tools', () => {
  const states = catalog.map((tool) => ({ id: tool.id, status: 'missing' as const }))

  assert.deepEqual(expandInstallQueue(['claude', 'codex'], states, catalog), ['homebrew', 'nodejs', 'claude', 'codex'])
})

test('expandInstallQueue skips dependencies that are already installed', () => {
  const states = catalog.map((tool) => ({
    id: tool.id,
    status: tool.id === 'nodejs' || tool.id === 'homebrew' ? 'installed' as const : 'missing' as const,
  }))

  assert.deepEqual(expandInstallQueue(['claude', 'codex'], states, catalog), ['claude', 'codex'])
})

test('expandInstallQueue reuses nodejs for additional npm CLIs', () => {
  const states = catalog.map((tool) => ({ id: tool.id, status: 'missing' as const }))

  assert.deepEqual(expandInstallQueue(['gemini', 'openclaw'], states, catalog), ['homebrew', 'nodejs', 'gemini', 'openclaw'])
})

test('createToolCatalog exposes only platform package managers', () => {
  const macosIds = createToolCatalog('macos').map((tool) => tool.id)
  const windowsIds = createToolCatalog('windows').map((tool) => tool.id)

  assert.equal(macosIds.includes('homebrew'), true)
  assert.equal(macosIds.includes('winget'), false)
  assert.equal(windowsIds.includes('homebrew'), false)
  assert.equal(windowsIds.includes('winget'), true)
})

test('expandInstallQueue adds the current platform package manager before managed tools', () => {
  const windowsCatalog = createToolCatalog('windows')
  const macosStates = catalog.map((tool) => ({ id: tool.id, status: 'missing' as const }))
  const windowsStates = windowsCatalog.map((tool) => ({ id: tool.id, status: 'missing' as const }))

  assert.deepEqual(expandInstallQueue(['git'], macosStates, catalog), ['homebrew', 'git'])
  assert.deepEqual(expandInstallQueue(['git'], windowsStates, windowsCatalog), ['winget', 'git'])
})

test('catalog marks platform package manager bootstraps with the sudo sentinel', () => {
  const homebrew = byId.get('homebrew')!
  const winget = createToolCatalog('windows').find((tool) => tool.id === 'winget')!
  const nodejs = byId.get('nodejs')!

  assert.equal(homebrew.install.startsWith('!SUDO '), true)
  assert.equal(homebrew.detect.startsWith('!SUDO '), false)
  assert.equal(winget.install.startsWith('!SUDO '), true)
  assert.equal(winget.detect.startsWith('!SUDO '), false)
  assert.equal(nodejs.install.startsWith('!SUDO '), false)
  assert.equal(nodejs.uninstall.startsWith('!SUDO '), false)
})

test('detectTool marks tools installed only when command output matches the version regex', async () => {
  const result = await detectTool(byId.get('nodejs')!, async () => shellResult('v20.11.0', '', 0))

  assert.deepEqual(result, { status: 'installed', version: '20.11.0' })
})

test('detectTool treats missing versions as missing even when the shell exits nonzero', async () => {
  const result = await detectTool(byId.get('nodejs')!, async () => shellResult('', 'node: command not found', 127))

  assert.deepEqual(result, { status: 'missing', version: null })
})

test('detectTool marks shell bridge failures as failed', async () => {
  const result = await detectTool(byId.get('nodejs')!, async () => {
    throw new Error('tauri invoke failed')
  })

  assert.deepEqual(result, { status: 'failed', version: null })
})

test('runToolAction marks failed installs without running a post-action refresh', async () => {
  const claude = byId.get('claude')!
  const calls: string[] = []
  const result = await runToolAction(claude, 'install', async (command) => {
    calls.push(command)
    return shellResult('', 'npm failed', 1)
  })

  assert.deepEqual(result, { status: 'failed', version: null })
  assert.deepEqual(calls, [claude.install])
})

test('runToolAction marks failed uninstalls without running a post-action refresh', async () => {
  const codex = byId.get('codex')!
  const calls: string[] = []
  const result = await runToolAction(codex, 'remove', async (command) => {
    calls.push(command)
    return shellResult('', 'npm failed', 1)
  })

  assert.deepEqual(result, { status: 'failed', version: null })
  assert.deepEqual(calls, [codex.uninstall])
})

test('empty package manager uninstall command leaves remove to fail through detection', async () => {
  const homebrew = byId.get('homebrew')!
  const calls: string[] = []
  const result = await runToolAction(homebrew, 'remove', async (command) => {
    calls.push(command)
    return command === homebrew.uninstall
      ? shellResult('', '', 0)
      : shellResult('Homebrew 4.5.0', '', 0)
  })
  const nextState = resolveToolActionState(result, { id: 'homebrew', status: 'installed', version: '4.5.0' }, 'remove')

  assert.equal(homebrew.uninstall, '')
  assert.deepEqual(result, { status: 'installed', version: '4.5.0' })
  assert.deepEqual(nextState, { status: 'installed', version: '4.5.0' })
  assert.deepEqual(calls, [homebrew.uninstall, homebrew.detect])
})

test('runToolAction refreshes detection after successful installs', async () => {
  const codex = byId.get('codex')!
  const calls: string[] = []
  const result = await runToolAction(codex, 'install', async (command) => {
    calls.push(command)
    return command === codex.install
      ? shellResult('installed', '', 0)
      : shellResult('codex 0.9.1', '', 0)
  })

  assert.deepEqual(result, { status: 'installed', version: '0.9.1' })
  assert.deepEqual(calls, [codex.install, codex.detect])
})

test('resolveToolActionState restores missing state after a failed install', () => {
  const result = resolveToolActionState(
    { status: 'failed', version: null },
    { id: 'codex', status: 'missing', version: null },
    'install',
  )

  assert.deepEqual(result, { status: 'missing', version: null })
})

test('resolveToolActionState restores installed state after a failed remove', () => {
  const result = resolveToolActionState(
    { status: 'failed', version: null },
    { id: 'git', status: 'installed', version: '2.49.0' },
    'remove',
  )

  assert.deepEqual(result, { status: 'installed', version: '2.49.0' })
})

function shellResult(stdout: string, stderr: string, exitCode: number): ShellResult {
  return { stdout, stderr, exitCode }
}
