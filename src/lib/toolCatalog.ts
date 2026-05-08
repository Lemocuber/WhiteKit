export type ToolId =
  | 'homebrew'
  | 'winget'
  | 'nodejs'
  | 'python'
  | 'git'
  | 'claude'
  | 'codex'
  | 'gemini'
  | 'openclaw'
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

const toolCatalogSources: ToolCatalogSource[] = [
  {
    id: 'homebrew',
    name: 'Homebrew',
    description: 'macOS 包管理器，环境安装的基建设施',
    platforms: ['macos'],
    detect: {
      macos: 'brew --version',
    },
    install: {
      macos: '!SUDO /usr/bin/curl -fsSL -o /tmp/whitekit-homebrew.pkg https://github.com/Homebrew/brew/releases/latest/download/Homebrew.pkg && /usr/sbin/installer -pkg /tmp/whitekit-homebrew.pkg -target /',
    },
    uninstall: {
      macos: '',
    },
    dependencies: [],
    versionRegex: '\\d+\\.\\d+\\.\\d+',
  },
  {
    id: 'winget',
    name: 'Winget',
    description: 'Windows 包管理器，环境安装的基建设施',
    platforms: ['windows'],
    detect: {
      windows: 'winget --version',
    },
    install: {
      windows: '!SUDO powershell -NoProfile -Command "Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe"',
    },
    uninstall: {
      windows: '',
    },
    dependencies: [],
    versionRegex: '\\d+\\.\\d+\\.\\d+',
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    description: 'AI 时代下，红利吃满的脚本语言之神',
    detect: {
      macos: 'node --version',
      windows: 'node --version',
    },
    install: {
      macos: 'brew install node',
      windows: 'winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements',
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
    versionRegex: '\\d+\\.\\d+\\.\\d+',
  },
  {
    id: 'python',
    name: 'Python',
    description: '在特定领域仍有优势区间的老牌脚本语言',
    detect: {
      macos: 'python3 --version',
      windows: 'python --version',
    },
    install: {
      macos: 'brew install python',
      windows: 'winget install --id Python.Python.3.13 -e --accept-package-agreements --accept-source-agreements',
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
    versionRegex: '\\d+\\.\\d+\\.\\d+',
  },
  {
    id: 'git',
    name: 'Git',
    description: '养活 Github 的经典版本控制系统',
    detect: {
      macos: 'git --version',
      windows: 'git --version',
    },
    install: {
      macos: 'brew install git',
      windows: 'winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements',
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
    versionRegex: '\\d+\\.\\d+\\.\\d+',
  },
  {
    id: 'claude',
    name: 'Claude Code',
    description: '@Anthropic // 可能是有史以来最强大的 AI 开发工具，行业唯一标杆真神',
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
    versionRegex: '\\d+\\.\\d+\\.\\d+',
  },
  {
    id: 'codex',
    name: 'Codex',
    description: '@OpenAI // 更简洁，更轻量，但功能完善度较低，可以作为牛马使用',
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
    versionRegex: '\\d+\\.\\d+\\.\\d+',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    description: '@Google // 如果送会员还算可堪一用，前端审美尚可',
    detect: {
      macos: 'gemini --version',
      windows: 'gemini --version',
    },
    install: {
      macos: 'npm install -g @google/gemini-cli',
      windows: 'npm install -g @google/gemini-cli',
    },
    uninstall: {
      macos: 'npm uninstall -g @google/gemini-cli',
      windows: 'npm uninstall -g @google/gemini-cli',
    },
    dependencies: ['nodejs'],
    versionRegex: '\\d+\\.\\d+\\.\\d+',
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    description: '不知道，总之就是很出圈，本地更建议直接用 Claude Code',
    detect: {
      macos: 'openclaw --version',
      windows: 'openclaw --version',
    },
    install: {
      macos: 'npm install -g openclaw',
      windows: 'npm install -g openclaw',
    },
    uninstall: {
      macos: 'npm uninstall -g openclaw',
      windows: 'npm uninstall -g openclaw',
    },
    dependencies: ['nodejs'],
    versionRegex: '\\d+\\.\\d+\\.\\d+(?:-\\d+)?',
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
