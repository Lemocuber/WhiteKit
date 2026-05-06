export type ToolId = 'homebrew' | 'winget' | 'nodejs' | 'python' | 'git' | 'claude' | 'codex'
export type ToolStatus = 'checking' | 'installed' | 'missing' | 'processing' | 'failed'
export type ToolPlatform = 'macos' | 'windows'

export interface ToolCommands {
  detect: string
  install: string
  uninstall: string
  dependencies: ToolId[]
  versionRegex: string
}

export interface ToolCatalogEntry extends ToolCommands {
  id: ToolId
  name: string
  description: string
}

interface PlatformCommands {
  macos: string
  windows: string
}

interface ToolCatalogSource {
  id: ToolId
  name: string
  description: string
  platforms?: ToolPlatform[]
  detect: Partial<PlatformCommands>
  install: Partial<PlatformCommands>
  uninstall: Partial<PlatformCommands>
  dependencies: ToolId[]
  platformDependencies?: Partial<Record<ToolPlatform, ToolId[]>>
  versionRegex: string
}

export const defaultVersionRegex = String.raw`\d+\.\d+\.\d+`

const brewNode = 'brew install node'
const wingetAgreements = '--accept-package-agreements --accept-source-agreements'
const emptyUninstall = ''

const toolCatalogSources: ToolCatalogSource[] = [
  {
    id: 'homebrew',
    name: 'Homebrew',
    description: 'macOS package manager for developer tooling',
    platforms: ['macos'],
    detect: {
      macos: 'brew --version',
    },
    install: {
      macos: 'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
    },
    uninstall: {
      macos: emptyUninstall,
    },
    dependencies: [],
    versionRegex: defaultVersionRegex,
  },
  {
    id: 'winget',
    name: 'Winget',
    description: 'Windows package manager for developer tooling',
    platforms: ['windows'],
    detect: {
      windows: 'winget --version',
    },
    install: {
      windows: 'powershell -NoProfile -Command "Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe"',
    },
    uninstall: {
      windows: emptyUninstall,
    },
    dependencies: [],
    versionRegex: defaultVersionRegex,
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    description: 'JavaScript runtime for backend dev',
    detect: {
      macos: 'node --version',
      windows: 'node --version',
    },
    install: {
      macos: brewNode,
      windows: `winget install --id OpenJS.NodeJS.LTS -e ${wingetAgreements}`,
    },
    uninstall: {
      macos: 'brew uninstall node',
      windows: 'winget uninstall --id OpenJS.NodeJS.LTS -e',
    },
    dependencies: [],
    platformDependencies: {
      macos: ['homebrew'],
      windows: ['winget'],
    },
    versionRegex: defaultVersionRegex,
  },
  {
    id: 'python',
    name: 'Python',
    description: 'High-level programming language',
    detect: {
      macos: 'python3 --version',
      windows: 'python --version',
    },
    install: {
      macos: 'brew install python',
      windows: `winget install --id Python.Python.3.13 -e ${wingetAgreements}`,
    },
    uninstall: {
      macos: 'brew uninstall python',
      windows: 'winget uninstall --id Python.Python.3.13 -e',
    },
    dependencies: [],
    platformDependencies: {
      macos: ['homebrew'],
      windows: ['winget'],
    },
    versionRegex: defaultVersionRegex,
  },
  {
    id: 'git',
    name: 'Git',
    description: 'Distributed version control system',
    detect: {
      macos: 'git --version',
      windows: 'git --version',
    },
    install: {
      macos: 'brew install git',
      windows: `winget install --id Git.Git -e ${wingetAgreements}`,
    },
    uninstall: {
      macos: 'brew uninstall git',
      windows: 'winget uninstall --id Git.Git -e',
    },
    dependencies: [],
    platformDependencies: {
      macos: ['homebrew'],
      windows: ['winget'],
    },
    versionRegex: defaultVersionRegex,
  },
  {
    id: 'claude',
    name: 'Claude Code',
    description: 'Anthropic CLI for agentic coding',
    detect: {
      macos: 'claude --version',
      windows: 'claude --version',
    },
    install: {
      macos: 'npm install -g @anthropic-ai/claude-code',
      windows: 'npm install -g @anthropic-ai/claude-code',
    },
    uninstall: {
      macos: 'npm uninstall -g @anthropic-ai/claude-code',
      windows: 'npm uninstall -g @anthropic-ai/claude-code',
    },
    dependencies: ['nodejs'],
    versionRegex: defaultVersionRegex,
  },
  {
    id: 'codex',
    name: 'Codex',
    description: 'OpenAI CLI for agentic coding',
    detect: {
      macos: 'codex --version',
      windows: 'codex --version',
    },
    install: {
      macos: 'npm install -g @openai/codex',
      windows: 'npm install -g @openai/codex',
    },
    uninstall: {
      macos: 'npm uninstall -g @openai/codex',
      windows: 'npm uninstall -g @openai/codex',
    },
    dependencies: ['nodejs'],
    versionRegex: defaultVersionRegex,
  },
]

export function createToolCatalog(platform = detectToolPlatform()): ToolCatalogEntry[] {
  return toolCatalogSources
    .filter((tool) => !tool.platforms || tool.platforms.includes(platform))
    .map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      detect: tool.detect[platform] ?? '',
      install: tool.install[platform] ?? '',
      uninstall: tool.uninstall[platform] ?? '',
      dependencies: [...(tool.platformDependencies?.[platform] ?? tool.dependencies)],
      versionRegex: tool.versionRegex,
    }))
}

export function detectToolPlatform(platform = globalThis.navigator?.platform ?? ''): ToolPlatform {
  return /win/i.test(platform) ? 'windows' : 'macos'
}
