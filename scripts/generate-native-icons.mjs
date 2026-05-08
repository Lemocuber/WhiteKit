import { cpSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tauriCli = resolve(rootDir, 'node_modules/@tauri-apps/cli/tauri.js')
const outputDir = resolve(rootDir, 'src-tauri/icons')
const macSource = resolve(rootDir, 'public/brand/whitekit-native-icon-macos.svg')
const winSource = resolve(rootDir, 'public/brand/whitekit-native-icon-windows.svg')
const tempRoot = mkdtempSync(join(tmpdir(), 'whitekit-icons-'))
const macOutput = join(tempRoot, 'macos')
const winOutput = join(tempRoot, 'windows')

const runIconGen = (input, output) =>
  execFileSync(process.execPath, [tauriCli, 'icon', input, '--output', output], {
    cwd: rootDir,
    stdio: 'inherit',
  })

try {
  runIconGen(macSource, macOutput)
  runIconGen(winSource, winOutput)

  rmSync(outputDir, { force: true, recursive: true })
  cpSync(macOutput, outputDir, { recursive: true })

  for (const entry of readdirSync(winOutput, { withFileTypes: true })) {
    if (!entry.isFile() || entry.name === 'icon.icns') continue

    cpSync(join(winOutput, entry.name), join(outputDir, entry.name))
  }
} finally {
  rmSync(tempRoot, { force: true, recursive: true })
}
