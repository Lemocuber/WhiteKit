import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildToolConfigWrites,
  getToolConfigPaths,
  getToolConfigValidationErrors,
  makeDirCommand,
  readFileCommand,
  saveToolConfig,
  validateToolConfigInput,
} from './toolConfig.ts'
import type { ShellResult } from './toolLifecycle.ts'

const input = {
  baseUrl: 'https://llm.whitekit.test/v1',
  apiKey: 'sk-whitekit',
  model: 'gpt-5.5',
}
const claudeInput = {
  ...input,
  model: 'opus-4.6',
}

test('codex missing files create expected auth JSON and config TOML', () => {
  const writes = buildToolConfigWrites('codex', input, { platform: 'macos' })

  assert.equal(writes[0].path, '~/.codex/auth.json')
  assert.deepEqual(JSON.parse(writes[0].content), {
    OPENAI_API_KEY: 'sk-whitekit',
    auth_mode: 'apikey',
  })
  assert.equal(writes[1].path, '~/.codex/config.toml')
  assert.equal(writes[1].content, `model = "gpt-5.5"
model_provider = "whitekit"

[model_providers.whitekit]
name = "whitekit"
base_url = "https://llm.whitekit.test/v1"
wire_api = "responses"
requires_openai_auth = true
`)
})

test('codex existing JSON and TOML preserve unrelated content while upserting WhiteKit provider', () => {
  const writes = buildToolConfigWrites('codex', input, {
    platform: 'macos',
    authJson: JSON.stringify({ OPENAI_API_KEY: 'old', account_id: 'acct_keep' }),
    configToml: `model = "gpt-5"
model_provider = "old"

[profiles.default]
model = "gpt-5-mini"

[model_providers.whitekit]
extra = "keep"
base_url = "https://old.example"
requires_openai_auth = false

[other]
key = "value"
`,
  })

  assert.deepEqual(JSON.parse(writes[0].content), {
    OPENAI_API_KEY: 'sk-whitekit',
    auth_mode: 'apikey',
    account_id: 'acct_keep',
  })
  assert.match(writes[1].content, /^model = "gpt-5.5"\nmodel_provider = "whitekit"/)
  assert.match(writes[1].content, /\[profiles\.default\]\nmodel = "gpt-5-mini"/)
  assert.match(writes[1].content, /\[model_providers\.whitekit\]\nname = "whitekit"\nwire_api = "responses"\nextra = "keep"\nbase_url = "https:\/\/llm\.whitekit\.test\/v1"\nrequires_openai_auth = true/)
  assert.match(writes[1].content, /\[other\]\nkey = "value"/)
})

test('claude missing settings creates env settings JSON', () => {
  const writes = buildToolConfigWrites('claude', claudeInput, { platform: 'macos' })

  assert.equal(writes[0].path, '~/.claude/settings.json')
  assert.deepEqual(JSON.parse(writes[0].content), {
    env: {
      ANTHROPIC_AUTH_TOKEN: 'sk-whitekit',
      ANTHROPIC_BASE_URL: 'https://llm.whitekit.test/v1',
    },
    model: 'opus-4.6',
  })
})

test('claude existing settings preserve top-level and env keys while updating Anthropic vars', () => {
  const writes = buildToolConfigWrites('claude', claudeInput, {
    platform: 'macos',
    settingsJson: JSON.stringify({
      model: 'old-model',
      permissions: { allow: ['Bash(git status)'] },
      env: {
        KEEP_ME: 'yes',
        ANTHROPIC_AUTH_TOKEN: 'old',
      },
    }),
  })

  assert.deepEqual(JSON.parse(writes[0].content), {
    model: 'opus-4.6',
    permissions: { allow: ['Bash(git status)'] },
    env: {
      KEEP_ME: 'yes',
      ANTHROPIC_AUTH_TOKEN: 'sk-whitekit',
      ANTHROPIC_BASE_URL: 'https://llm.whitekit.test/v1',
    },
  })
})

test('empty model removes model fields from Codex and Claude config', () => {
  const emptyModelInput = { ...input, model: '   ' }
  const codexWrites = buildToolConfigWrites('codex', emptyModelInput, {
    platform: 'macos',
    configToml: `model = "old-root-model"
model_provider = "old"

[profiles.default]
model = "keep-profile-model"
`,
  })
  const claudeWrites = buildToolConfigWrites('claude', { ...claudeInput, model: '' }, {
    platform: 'macos',
    settingsJson: JSON.stringify({
      model: 'old-claude-model',
      theme: 'dark',
      env: { KEEP_ME: 'yes' },
    }),
  })

  assert.doesNotMatch(codexWrites[1].content.split('\n[')[0], /^model\s*=/m)
  assert.match(codexWrites[1].content, /^model_provider = "whitekit"/m)
  assert.match(codexWrites[1].content, /\[profiles\.default\]\nmodel = "keep-profile-model"/)
  assert.deepEqual(JSON.parse(claudeWrites[0].content), {
    theme: 'dark',
    env: {
      KEEP_ME: 'yes',
      ANTHROPIC_AUTH_TOKEN: 'sk-whitekit',
      ANTHROPIC_BASE_URL: 'https://llm.whitekit.test/v1',
    },
  })
})

test('invalid JSON and invalid env fail before writing', async () => {
  assert.throws(
    () => buildToolConfigWrites('codex', input, { platform: 'macos', authJson: '[]' }),
    /Codex auth\.json must contain a JSON object/,
  )

  const codexPaths = getToolConfigPaths('codex', 'macos')
  const codexWriteCommands: string[] = []

  await assert.rejects(
    () => saveToolConfig('codex', input, async (command) => {
      if (command === makeDirCommand(codexPaths.dir, 'macos')) return shellResult('', '', 0)
      if (command === readFileCommand(codexPaths.authJson!, 'macos')) return shellResult('{bad json', '', 0)
      if (command === readFileCommand(codexPaths.configToml!, 'macos')) return shellResult('', '', 0)

      codexWriteCommands.push(command)
      return shellResult('', '', 0)
    }, 'macos'),
    /Codex auth\.json must contain a JSON object/,
  )
  assert.deepEqual(codexWriteCommands, [])

  const claudePaths = getToolConfigPaths('claude', 'macos')
  const claudeWriteCommands: string[] = []

  await assert.rejects(
    () => saveToolConfig('claude', input, async (command) => {
      if (command === makeDirCommand(claudePaths.dir, 'macos')) return shellResult('', '', 0)
      if (command === readFileCommand(claudePaths.settingsJson!, 'macos')) {
        return shellResult(JSON.stringify({ env: [] }), '', 0)
      }

      claudeWriteCommands.push(command)
      return shellResult('', '', 0)
    }, 'macos'),
    /Claude settings\.json env must be an object/,
  )
  assert.deepEqual(claudeWriteCommands, [])
})

test('empty API key and invalid base URL are rejected', () => {
  const errors = getToolConfigValidationErrors({ baseUrl: 'ftp://example.com', apiKey: '', model: '' })

  assert.equal(errors.baseUrl, 'Base URL must start with http:// or https://')
  assert.equal(errors.apiKey, 'API key is required')
  assert.throws(
    () => validateToolConfigInput({ baseUrl: 'not a url', apiKey: 'sk-test', model: '' }),
    /Enter a valid HTTP\(S\) base URL/,
  )
})

function shellResult(stdout: string, stderr: string, exitCode: number): ShellResult {
  return { stdout, stderr, exitCode }
}
