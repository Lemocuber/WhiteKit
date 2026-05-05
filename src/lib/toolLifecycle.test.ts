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
})

test('expandInstallQueue adds missing dependencies before selected tools', () => {
  const states = catalog.map((tool) => ({ id: tool.id, status: 'missing' as const }))

  assert.deepEqual(expandInstallQueue(['claude', 'codex'], states, catalog), ['nodejs', 'claude', 'codex'])
})

test('expandInstallQueue skips dependencies that are already installed', () => {
  const states = catalog.map((tool) => ({
    id: tool.id,
    status: tool.id === 'nodejs' ? 'installed' as const : 'missing' as const,
  }))

  assert.deepEqual(expandInstallQueue(['claude', 'codex'], states, catalog), ['claude', 'codex'])
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
