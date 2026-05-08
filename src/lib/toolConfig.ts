import { detectToolPlatform, type ToolId, type ToolPlatform } from './toolCatalog.ts'
import type { ShellResult, ShellRunner } from './toolLifecycle.ts'

export type ToolConfigTarget = Extract<ToolId, 'codex' | 'claude'>

export interface ToolConfigInput {
  baseUrl: string
  apiKey: string
  model: string
}

export interface ToolConfigValidationErrors {
  baseUrl?: string
  apiKey?: string
}

export interface ToolConfigWrite {
  path: string
  content: string
}

interface ToolConfigPaths {
  dir: string
  authJson?: string
  configToml?: string
  settingsJson?: string
}

interface BuildToolConfigOptions {
  authJson?: string
  configToml?: string
  settingsJson?: string
  platform?: ToolPlatform
}

export class ToolConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ToolConfigError'
  }
}

const codexProviderSection = 'model_providers.whitekit'
const codexProviderKeys = {
  name: '"whitekit"',
  base_url: '',
  wire_api: '"responses"',
  requires_openai_auth: 'true',
}

export const emptyToolConfigInput = (): ToolConfigInput => ({ baseUrl: '', apiKey: '', model: '' })

export function getToolConfigValidationErrors(input: ToolConfigInput): ToolConfigValidationErrors {
  const baseUrl = input.baseUrl.trim()
  const apiKey = input.apiKey.trim()
  const errors: ToolConfigValidationErrors = {}

  if (!apiKey) {
    errors.apiKey = 'API key is required'
  }

  try {
    const parsed = new URL(baseUrl)

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      errors.baseUrl = 'Base URL must start with http:// or https://'
    }
  } catch {
    errors.baseUrl = 'Enter a valid HTTP(S) base URL'
  }

  return errors
}

export function validateToolConfigInput(input: ToolConfigInput): ToolConfigInput {
  const errors = getToolConfigValidationErrors(input)
  const firstError = errors.baseUrl ?? errors.apiKey

  if (firstError) {
    throw new ToolConfigError(firstError)
  }

  return {
    baseUrl: input.baseUrl.trim(),
    apiKey: input.apiKey.trim(),
    model: input.model.trim(),
  }
}

export function getToolConfigPaths(target: ToolConfigTarget, platform = detectToolPlatform()): ToolConfigPaths {
  const codexDir = platform === 'windows' ? '%USERPROFILE%\\.codex' : '~/.codex'
  const claudeDir = platform === 'windows' ? '%USERPROFILE%\\.claude' : '~/.claude'

  return target === 'codex'
    ? {
      dir: codexDir,
      authJson: `${codexDir}${platform === 'windows' ? '\\auth.json' : '/auth.json'}`,
      configToml: `${codexDir}${platform === 'windows' ? '\\config.toml' : '/config.toml'}`,
    }
    : {
      dir: claudeDir,
      settingsJson: `${claudeDir}${platform === 'windows' ? '\\settings.json' : '/settings.json'}`,
    }
}

export function readFileCommand(path: string, platform = detectToolPlatform()): string {
  if (platform === 'windows') {
    return powershellCommand(
      `$p=[Environment]::ExpandEnvironmentVariables('${escapePowerShellSingleQuoted(path)}');if(Test-Path -LiteralPath $p -PathType Leaf){Get-Content -LiteralPath $p -Raw -Encoding utf8}`,
    )
  }

  const quotedPath = quotePosixPath(path)

  return `if [ -f ${quotedPath} ]; then cat ${quotedPath}; fi`
}

export function makeDirCommand(dir: string, platform = detectToolPlatform()): string {
  if (platform === 'windows') {
    return powershellCommand(
      `$p=[Environment]::ExpandEnvironmentVariables('${escapePowerShellSingleQuoted(dir)}');New-Item -ItemType Directory -Force -Path $p | Out-Null`,
    )
  }

  return `mkdir -p ${quotePosixPath(dir)}`
}

export function writeFileCommand(path: string, content: string, platform = detectToolPlatform()): string {
  if (platform === 'windows') {
    return powershellCommand(
      `$p=[Environment]::ExpandEnvironmentVariables('${escapePowerShellSingleQuoted(path)}');$c=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${bytesToBase64(new TextEncoder().encode(content))}'));Set-Content -LiteralPath $p -Value $c -Encoding utf8 -NoNewline`,
    )
  }

  return `printf '%s' ${quotePosixValue(content)} > ${quotePosixPath(path)}`
}

export function mergeCodexAuthJson(content: string, apiKey: string): string {
  const auth = parseJsonObject(content, 'Codex auth.json')

  auth.OPENAI_API_KEY = apiKey
  auth.auth_mode = 'apikey'

  return `${JSON.stringify(auth, null, 2)}\n`
}

export function mergeClaudeSettingsJson(content: string, input: ToolConfigInput): string {
  const settings = parseJsonObject(content, 'Claude settings.json')
  const env = settings.env

  if (env === undefined) {
    settings.env = {}
  } else if (!isPlainObject(env)) {
    throw new ToolConfigError('Claude settings.json env must be an object')
  }

  const nextEnv = settings.env as Record<string, unknown>

  nextEnv.ANTHROPIC_AUTH_TOKEN = input.apiKey
  nextEnv.ANTHROPIC_BASE_URL = input.baseUrl

  if (input.model) {
    settings.model = input.model
  } else {
    delete settings.model
  }

  return `${JSON.stringify(settings, null, 2)}\n`
}

export function mergeCodexConfigToml(content: string, input: Pick<ToolConfigInput, 'baseUrl' | 'model'>): string {
  const lines = normalizeTomlLines(content)

  upsertRootTomlEntries(lines, {
    model: input.model ? tomlString(input.model) : null,
    model_provider: '"whitekit"',
  })

  const providerEntries = {
    ...codexProviderKeys,
    base_url: tomlString(input.baseUrl),
  }
  const sectionHeader = `[${codexProviderSection}]`
  const sectionIndex = lines.findIndex((line) => isNamedTomlSection(line, codexProviderSection))

  if (sectionIndex === -1) {
    if (lines.length > 0 && lines.at(-1)?.trim()) {
      lines.push('')
    }

    lines.push(sectionHeader, ...Object.entries(providerEntries).map(([key, value]) => `${key} = ${value}`))

    return finishToml(lines)
  }

  const nextSectionOffset = lines.slice(sectionIndex + 1).findIndex(isTomlSection)
  const sectionEnd = nextSectionOffset === -1 ? lines.length : sectionIndex + 1 + nextSectionOffset
  const seen = new Set<string>()
  const body = lines.slice(sectionIndex + 1, sectionEnd).flatMap((line) => {
    const key = Object.keys(providerEntries).find((entry) => new RegExp(`^\\s*${entry}\\s*=`).test(line))

    if (!key) return [line]
    if (seen.has(key)) return []

    seen.add(key)
    return [`${key} = ${providerEntries[key as keyof typeof providerEntries]}`]
  })
  const missing = Object.entries(providerEntries)
    .filter(([key]) => !seen.has(key))
    .map(([key, value]) => `${key} = ${value}`)

  lines.splice(sectionIndex + 1, sectionEnd - sectionIndex - 1, ...missing, ...body)

  return finishToml(lines)
}

export function buildToolConfigWrites(
  target: ToolConfigTarget,
  input: ToolConfigInput,
  options: BuildToolConfigOptions = {},
): ToolConfigWrite[] {
  const platform = options.platform ?? detectToolPlatform()
  const normalized = validateToolConfigInput(input)
  const paths = getToolConfigPaths(target, platform)

  if (target === 'codex') {
    return [
      {
        path: paths.authJson!,
        content: mergeCodexAuthJson(options.authJson ?? '', normalized.apiKey),
      },
      {
        path: paths.configToml!,
        content: mergeCodexConfigToml(options.configToml ?? '', normalized),
      },
    ]
  }

  return [{
    path: paths.settingsJson!,
    content: mergeClaudeSettingsJson(options.settingsJson ?? '', normalized),
  }]
}

export async function loadToolConfig(
  target: ToolConfigTarget,
  runShell: ShellRunner,
  platform = detectToolPlatform(),
): Promise<ToolConfigInput> {
  const paths = getToolConfigPaths(target, platform)

  if (target === 'codex') {
    try {
      const authJson = await readConfigFile(paths.authJson!, runShell, platform)
      const configToml = await readConfigFile(paths.configToml!, runShell, platform)

      return {
        baseUrl: readCodexConfigTomlValue(configToml, codexProviderSection, 'base_url'),
        apiKey: readCodexAuthJsonApiKey(authJson),
        model: readCodexRootModel(configToml),
      }
    } catch {
      return emptyToolConfigInput()
    }
  }

  try {
    const settingsJson = await readConfigFile(paths.settingsJson!, runShell, platform)

    return readClaudeSettingsJson(settingsJson)
  } catch {
    return emptyToolConfigInput()
  }
}

export async function saveToolConfig(
  target: ToolConfigTarget,
  input: ToolConfigInput,
  runShell: ShellRunner,
  platform = detectToolPlatform(),
): Promise<void> {
  validateToolConfigInput(input)

  const paths = getToolConfigPaths(target, platform)

  await runChecked(makeDirCommand(paths.dir, platform), runShell, 'Failed to create config directory')

  let writes: ToolConfigWrite[]

  try {
    const existing = target === 'codex'
      ? {
        authJson: await readConfigFile(paths.authJson!, runShell, platform),
        configToml: await readConfigFile(paths.configToml!, runShell, platform),
        platform,
      }
      : {
        settingsJson: await readConfigFile(paths.settingsJson!, runShell, platform),
        platform,
      }

    writes = buildToolConfigWrites(target, input, existing)
  } catch {
    writes = buildToolConfigWrites(target, input, { platform })
  }

  for (const write of writes) {
    await runChecked(writeFileCommand(write.path, write.content, platform), runShell, `Failed to write ${write.path}`)
  }
}

async function readConfigFile(path: string, runShell: ShellRunner, platform: ToolPlatform): Promise<string> {
  const result = await runChecked(readFileCommand(path, platform), runShell, `Failed to read ${path}`)

  return result.stdout
}

async function runChecked(command: string, runShell: ShellRunner, errorPrefix: string): Promise<ShellResult> {
  const result = await runShell(command)

  if (result.exitCode !== 0) {
    throw new ToolConfigError(`${errorPrefix}: ${result.stderr || result.stdout || `exit ${result.exitCode}`}`)
  }

  return result
}

function parseJsonObject(content: string, label: string): Record<string, unknown> {
  if (!content.trim()) return {}

  try {
    const parsed: unknown = JSON.parse(content)

    if (isPlainObject(parsed)) return parsed
  } catch {
    throw new ToolConfigError(`${label} must contain a JSON object`)
  }

  throw new ToolConfigError(`${label} must contain a JSON object`)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeTomlLines(content: string): string[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  return normalized.endsWith('\n')
    ? normalized.slice(0, -1).split('\n')
    : normalized
      ? normalized.split('\n')
      : []
}

function finishToml(lines: string[]): string {
  return `${lines.join('\n')}\n`
}

function upsertRootTomlEntries(lines: string[], entries: Record<string, string | null>): void {
  const firstSectionIndex = lines.findIndex(isTomlSection)
  const rootEnd = firstSectionIndex === -1 ? lines.length : firstSectionIndex
  const seen = new Set<string>()
  const nextRoot = lines.slice(0, rootEnd).flatMap((line) => {
    const key = Object.keys(entries).find((entry) => new RegExp(`^\\s*${entry}\\s*=`).test(line))

    if (!key) return [line]
    if (entries[key] === null) return []
    if (seen.has(key)) return []

    seen.add(key)
    return [`${key} = ${entries[key]}`]
  })
  const missing = Object.entries(entries)
    .filter(([key, value]) => value !== null && !seen.has(key))
    .map(([key, value]) => `${key} = ${value}`)

  lines.splice(0, rootEnd, ...nextRoot, ...missing)
}

function isTomlSection(line: string): boolean {
  return /^\s*\[[^\]]+\]\s*(?:#.*)?$/.test(line)
}

function isNamedTomlSection(line: string, name: string): boolean {
  return new RegExp(`^\\s*\\[\\s*${escapeRegExp(name)}\\s*\\]\\s*(?:#.*)?$`).test(line)
}

function readCodexAuthJsonApiKey(content: string): string {
  const value = parseJsonObject(content, 'Codex auth.json').OPENAI_API_KEY

  return typeof value === 'string' ? value : ''
}

function readClaudeSettingsJson(content: string): ToolConfigInput {
  const settings = parseJsonObject(content, 'Claude settings.json')
  const env = settings.env

  if (env !== undefined && !isPlainObject(env)) {
    throw new ToolConfigError('Claude settings.json env must be an object')
  }

  const nextEnv = env as Record<string, unknown> | undefined

  return {
    baseUrl: typeof nextEnv?.ANTHROPIC_BASE_URL === 'string' ? nextEnv.ANTHROPIC_BASE_URL : '',
    apiKey: typeof nextEnv?.ANTHROPIC_AUTH_TOKEN === 'string' ? nextEnv.ANTHROPIC_AUTH_TOKEN : '',
    model: typeof settings.model === 'string' ? settings.model : '',
  }
}

function readCodexRootModel(content: string): string {
  const lines = normalizeTomlLines(content)
  const rootEnd = lines.findIndex(isTomlSection)
  const rootLines = rootEnd === -1 ? lines : lines.slice(0, rootEnd)

  return readTomlKeyValue(rootLines, 'model')
}

function readCodexConfigTomlValue(content: string, section: string, key: string): string {
  const lines = normalizeTomlLines(content)
  const sectionIndex = lines.findIndex((line) => isNamedTomlSection(line, section))

  if (sectionIndex === -1) return ''

  const nextSectionOffset = lines.slice(sectionIndex + 1).findIndex(isTomlSection)
  const sectionEnd = nextSectionOffset === -1 ? lines.length : sectionIndex + 1 + nextSectionOffset

  return readTomlKeyValue(lines.slice(sectionIndex + 1, sectionEnd), key)
}

function readTomlKeyValue(lines: string[], key: string): string {
  for (const line of lines) {
    const match = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=\\s*(.+?)\\s*(?:#.*)?$`).exec(line)

    if (!match) continue

    return parseTomlString(match[1].trim())
  }

  return ''
}

function parseTomlString(value: string): string {
  if (!value) return ''
  const startsDouble = value.startsWith('"')
  const endsDouble = value.endsWith('"')
  const startsSingle = value.startsWith("'")
  const endsSingle = value.endsWith("'")

  if ((startsDouble || endsDouble) && !(startsDouble && endsDouble)) {
    throw new ToolConfigError('Codex config.toml contains an invalid string value')
  }

  if ((startsSingle || endsSingle) && !(startsSingle && endsSingle)) {
    throw new ToolConfigError('Codex config.toml contains an invalid string value')
  }

  if ((startsDouble && endsDouble) || (startsSingle && endsSingle)) {
    try {
      return startsDouble ? JSON.parse(value) : value.slice(1, -1)
    } catch {
      throw new ToolConfigError('Codex config.toml contains an invalid string value')
    }
  }

  return ''
}

function tomlString(value: string): string {
  return JSON.stringify(value)
}

function quotePosixPath(path: string): string {
  if (path.startsWith('~/')) {
    return `"$HOME/${path.slice(2).replace(/["\\`]/g, '\\$&')}"`
  }

  return quotePosixValue(path)
}

function quotePosixValue(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`
}

function powershellCommand(script: string): string {
  return `powershell -NoProfile -EncodedCommand ${bytesToBase64(stringToUtf16LeBytes(script))}`
}

function escapePowerShellSingleQuoted(value: string): string {
  return value.replace(/'/g, "''")
}

function stringToUtf16LeBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length * 2)

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)

    bytes[index * 2] = code & 0xff
    bytes[index * 2 + 1] = code >> 8
  }

  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize))
  }

  return btoa(binary)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
