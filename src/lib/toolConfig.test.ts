import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildToolConfigWrites,
  getToolConfigPaths,
  getToolConfigValidationErrors,
  loadToolConfig,
  makeDirCommand,
  readFileCommand,
  saveToolConfig,
  validateToolConfigInput,
  writeFileCommand,
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

test('loadToolConfig returns empty values when config files are missing', async () => {
  const codexPaths = getToolConfigPaths('codex', 'macos')
  const claudePaths = getToolConfigPaths('claude', 'macos')
  const runShell = async (command: string) => {
    if (command === readFileCommand(codexPaths.authJson!, 'macos')) return shellResult('', '', 0)
    if (command === readFileCommand(codexPaths.configToml!, 'macos')) return shellResult('', '', 0)
    if (command === readFileCommand(claudePaths.settingsJson!, 'macos')) return shellResult('', '', 0)

    assert.fail(`Unexpected command: ${command}`)
  }

  assert.deepEqual(await loadToolConfig('codex', runShell, 'macos'), {
    baseUrl: '',
    apiKey: '',
    model: '',
  })
  assert.deepEqual(await loadToolConfig('claude', runShell, 'macos'), {
    baseUrl: '',
    apiKey: '',
    model: '',
  })
})

test('loadToolConfig reads existing Codex values from auth and WhiteKit provider config', async () => {
  const codexPaths = getToolConfigPaths('codex', 'macos')

  const loaded = await loadToolConfig('codex', async (command) => {
    if (command === readFileCommand(codexPaths.authJson!, 'macos')) {
      return shellResult(JSON.stringify({ OPENAI_API_KEY: 'sk-codex', auth_mode: 'apikey' }), '', 0)
    }
    if (command === readFileCommand(codexPaths.configToml!, 'macos')) {
      return shellResult(`model = "gpt-5.5"
model_provider = "whitekit"

[profiles.default]
model = "keep-me"

[model_providers.whitekit]
name = "whitekit"
base_url = "https://llm.whitekit.test/v1"
wire_api = "responses"
`, '', 0)
    }

    assert.fail(`Unexpected command: ${command}`)
  }, 'macos')

  assert.deepEqual(loaded, {
    baseUrl: 'https://llm.whitekit.test/v1',
    apiKey: 'sk-codex',
    model: 'gpt-5.5',
  })
})

test('loadToolConfig reads existing Claude values from settings JSON', async () => {
  const claudePaths = getToolConfigPaths('claude', 'macos')

  const loaded = await loadToolConfig('claude', async (command) => {
    if (command === readFileCommand(claudePaths.settingsJson!, 'macos')) {
      return shellResult(JSON.stringify({
        model: 'opus-4.6',
        permissions: { allow: ['Bash(git status)'] },
        env: {
          ANTHROPIC_AUTH_TOKEN: 'sk-claude',
          ANTHROPIC_BASE_URL: 'https://claude.whitekit.test',
          KEEP_ME: 'yes',
        },
      }), '', 0)
    }

    assert.fail(`Unexpected command: ${command}`)
  }, 'macos')

  assert.deepEqual(loaded, {
    baseUrl: 'https://claude.whitekit.test',
    apiKey: 'sk-claude',
    model: 'opus-4.6',
  })
})

test('loadToolConfig leaves missing stored fields blank', async () => {
  const codexPaths = getToolConfigPaths('codex', 'macos')
  const claudePaths = getToolConfigPaths('claude', 'macos')

  assert.deepEqual(await loadToolConfig('codex', async (command) => {
    if (command === readFileCommand(codexPaths.authJson!, 'macos')) {
      return shellResult(JSON.stringify({ auth_mode: 'apikey' }), '', 0)
    }
    if (command === readFileCommand(codexPaths.configToml!, 'macos')) {
      return shellResult(`model_provider = "whitekit"

[model_providers.whitekit]
name = "whitekit"
`, '', 0)
    }

    assert.fail(`Unexpected command: ${command}`)
  }, 'macos'), {
    baseUrl: '',
    apiKey: '',
    model: '',
  })

  assert.deepEqual(await loadToolConfig('claude', async (command) => {
    if (command === readFileCommand(claudePaths.settingsJson!, 'macos')) {
      return shellResult(JSON.stringify({
        env: {
          KEEP_ME: 'yes',
        },
      }), '', 0)
    }

    assert.fail(`Unexpected command: ${command}`)
  }, 'macos'), {
    baseUrl: '',
    apiKey: '',
    model: '',
  })
})

test('loadToolConfig ignores malformed stored config', async () => {
  const codexPaths = getToolConfigPaths('codex', 'macos')
  const claudePaths = getToolConfigPaths('claude', 'macos')

  assert.deepEqual(await loadToolConfig('codex', async (command) => {
    if (command === readFileCommand(codexPaths.authJson!, 'macos')) {
      return shellResult('{bad json', '', 0)
    }
    if (command === readFileCommand(codexPaths.configToml!, 'macos')) {
      return shellResult(`model = "gpt-5.5"

[model_providers.whitekit]
base_url = "https://llm.whitekit.test/v1"
`, '', 0)
    }

    assert.fail(`Unexpected command: ${command}`)
  }, 'macos'), {
    apiKey: '',
    baseUrl: '',
    model: '',
  })

  assert.deepEqual(await loadToolConfig('claude', async (command) => {
    if (command === readFileCommand(claudePaths.settingsJson!, 'macos')) {
      return shellResult(JSON.stringify({ env: [] }), '', 0)
    }

    assert.fail(`Unexpected command: ${command}`)
  }, 'macos'), {
    baseUrl: '',
    apiKey: '',
    model: '',
  })
})

test('saveToolConfig falls back to fresh files when existing config is malformed', async () => {
  const codexPaths = getToolConfigPaths('codex', 'macos')
  const codexCommands: string[] = []

  await saveToolConfig('codex', input, async (command) => {
    codexCommands.push(command)
    if (command === makeDirCommand(codexPaths.dir, 'macos')) return shellResult('', '', 0)
    if (command === readFileCommand(codexPaths.authJson!, 'macos')) return shellResult('{bad json', '', 0)
    if (command === readFileCommand(codexPaths.configToml!, 'macos')) return shellResult('', '', 0)

    return shellResult('', '', 0)
  }, 'macos')
  assert.ok(codexCommands.includes(writeFileCommand(codexPaths.authJson!, `{
  "OPENAI_API_KEY": "sk-whitekit",
  "auth_mode": "apikey"
}
`, 'macos')))
  assert.ok(codexCommands.includes(writeFileCommand(codexPaths.configToml!, `model = "gpt-5.5"
model_provider = "whitekit"

[model_providers.whitekit]
name = "whitekit"
base_url = "https://llm.whitekit.test/v1"
wire_api = "responses"
requires_openai_auth = true
`, 'macos')))

  const claudePaths = getToolConfigPaths('claude', 'macos')
  const claudeCommands: string[] = []

  await saveToolConfig('claude', input, async (command) => {
    claudeCommands.push(command)
    if (command === makeDirCommand(claudePaths.dir, 'macos')) return shellResult('', '', 0)
    if (command === readFileCommand(claudePaths.settingsJson!, 'macos')) {
      return shellResult(JSON.stringify({ env: [] }), '', 0)
    }

    return shellResult('', '', 0)
  }, 'macos')
  assert.ok(claudeCommands.includes(writeFileCommand(claudePaths.settingsJson!, `{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-whitekit",
    "ANTHROPIC_BASE_URL": "https://llm.whitekit.test/v1"
  },
  "model": "gpt-5.5"
}
`, 'macos')))
})

test('windows file commands use encoded PowerShell to survive cmd shell quoting', () => {
  const paths = getToolConfigPaths('codex', 'windows')
  const readCommand = readFileCommand(paths.authJson!, 'windows')
  const writeCommand = writeFileCommand(paths.authJson!, `{"quote":"hello \\"cmd\\""}\n`, 'windows')

  assert.match(readCommand, /^powershell -NoProfile -EncodedCommand [A-Za-z0-9+/=]+$/)
  assert.equal(
    decodeEncodedPowerShell(readCommand),
    `$p=[Environment]::ExpandEnvironmentVariables('%USERPROFILE%\\.codex\\auth.json');if(Test-Path -LiteralPath $p -PathType Leaf){Get-Content -LiteralPath $p -Raw -Encoding utf8}`,
  )

  assert.match(writeCommand, /^powershell -NoProfile -EncodedCommand [A-Za-z0-9+/=]+$/)
  assert.match(decodeEncodedPowerShell(writeCommand), /^\$p=\[Environment\]::ExpandEnvironmentVariables/)
  assert.match(decodeEncodedPowerShell(writeCommand), /Set-Content -LiteralPath \$p -Value \$c -Encoding utf8 -NoNewline$/)
})

test('saveToolConfig uses encoded Windows file commands for writes', async () => {
  const paths = getToolConfigPaths('claude', 'windows')
  const commands: string[] = []

  await saveToolConfig('claude', claudeInput, async (command) => {
    commands.push(command)

    return shellResult('', '', 0)
  }, 'windows')

  assert.deepEqual(commands, [
    makeDirCommand(paths.dir, 'windows'),
    readFileCommand(paths.settingsJson!, 'windows'),
    writeFileCommand(paths.settingsJson!, `{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-whitekit",
    "ANTHROPIC_BASE_URL": "https://llm.whitekit.test/v1"
  },
  "model": "opus-4.6"
}
`, 'windows'),
  ])
  assert.ok(commands.every((command) => command.startsWith('powershell -NoProfile -EncodedCommand ')))
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

function decodeEncodedPowerShell(command: string): string {
  const encoded = command.split(' ').at(-1)

  assert.ok(encoded)

  return Buffer.from(encoded, 'base64').toString('utf16le')
}
