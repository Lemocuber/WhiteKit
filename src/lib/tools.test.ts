import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getFilteredTools,
  getNextToolFilter,
  isToolInstalled,
  type ToolFilter,
} from './toolFilters.ts'
import type { Tool } from './tools.ts'

function createTool(id: Tool['id'], status: Tool['status']): Tool {
  return {
    id,
    name: id,
    description: `${id} description`,
    iconSrc: `${id}.svg`,
    version: status === 'installed' ? '1.0.0' : null,
    status,
    selected: false,
    detect: '',
    install: '',
    uninstall: '',
    dependencies: [],
    versionRegex: '\\d+\\.\\d+\\.\\d+',
  }
}

test('getNextToolFilter cycles through all filter states in order', () => {
  const cycle: ToolFilter[] = ['all', 'installed', 'available', 'all']
  const result = cycle.slice(0, -1).map(getNextToolFilter)

  assert.deepEqual(result, cycle.slice(1))
})

test('getFilteredTools returns the expected tool subsets', () => {
  const installed = createTool('git', 'installed')
  const available = createTool('python', 'missing')
  const checking = createTool('codex', 'checking')
  const tools = [installed, available, checking]

  assert.deepEqual(getFilteredTools(tools, 'all'), tools)
  assert.deepEqual(getFilteredTools(tools, 'installed'), [installed])
  assert.deepEqual(getFilteredTools(tools, 'available'), [available, checking])
  assert.equal(isToolInstalled(installed), true)
  assert.equal(isToolInstalled(available), false)
})
