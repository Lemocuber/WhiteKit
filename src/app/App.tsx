import { useState } from 'react'

import claudeCodeIcon from '../assets/tools/claude-code.svg'
import codexIcon from '../assets/tools/codex.svg'
import gitIcon from '../assets/tools/git.svg'
import nodejsIcon from '../assets/tools/nodejs.svg'
import pythonIcon from '../assets/tools/python.svg'
import terminalIcon from '../assets/tools/terminal.svg'

interface Tool {
  id: string
  name: string
  iconSrc: string
  version: string | null
  description: string
  selected: boolean
}

type ToolFilter = 'all' | 'installed' | 'available'

const brandIconSrc = '/brand/whitekit.svg'
const filterTabs: Array<{ id: ToolFilter; label: string }> = [
  { id: 'all', label: 'All Tools' },
  { id: 'installed', label: 'Installed' },
  { id: 'available', label: 'Available' },
]
const surfaceInteractiveClasses = 'transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_#000]'
const surfacePressedClasses = 'translate-x-0.5 translate-y-0.5 shadow-[2px_2px_0_0_#000]'

function App() {
  const [activeFilter, setActiveFilter] = useState<ToolFilter>('all')
  const [tools, setTools] = useState<Tool[]>([
    { id: 'nodejs', name: 'Node.js', iconSrc: nodejsIcon, version: '20.11.0', description: 'JavaScript runtime for backend dev', selected: false },
    { id: 'python', name: 'Python', iconSrc: pythonIcon, version: '3.12.2', description: 'High-level programming language', selected: false },
    { id: 'git', name: 'Git', iconSrc: gitIcon, version: '2.44.0', description: 'Distributed version control system', selected: false },
    { id: 'claude', name: 'Claude Code', iconSrc: claudeCodeIcon, version: null, description: 'Anthropic CLI for agentic coding', selected: false },
    { id: 'codex', name: 'Codex', iconSrc: codexIcon, version: null, description: 'OpenAI CLI for agentic coding', selected: false },
  ])

  const toggleSelect = (id: string) => {
    setTools(currentTools => currentTools.map((tool) => (
      tool.id === id ? { ...tool, selected: !tool.selected } : tool
    )))
  }

  const filteredTools = tools.filter((tool) => {
    if (activeFilter === 'installed') {
      return tool.version !== null
    }

    if (activeFilter === 'available') {
      return tool.version === null
    }

    return true
  })

  const selectedTools = tools.filter(t => t.selected)
  const selectedInstalledCount = selectedTools.filter(t => t.version !== null).length
  const selectedMissingCount = selectedTools.filter(t => t.version === null).length

  const allSelectedInstalled = selectedTools.length > 0 && selectedTools.every(t => t.version !== null)
  const allSelectedMissing = selectedTools.length > 0 && selectedTools.every(t => t.version === null)
  
  const canUninstall = allSelectedInstalled
  const canInstall = allSelectedMissing

  const installText = canInstall ? `Install (${selectedMissingCount})` : 'Install'
  const removeText = canUninstall ? `Remove (${selectedInstalledCount})` : 'Remove'

  return (
    <main className="h-screen bg-canvas text-ink font-sans flex border-ink overflow-hidden select-none">
      
      {/* Main Section (80%) */}
      <section className="w-[80%] min-h-0 p-8 flex flex-col overflow-hidden border-r-4 border-ink relative">
        <header className="flex items-center gap-4 pl-2">
          <div className="w-16 h-16 bg-accent-lime border-4 border-ink shadow-brutal flex items-center justify-center p-2 transition-transform hover:scale-105">
            <img src={brandIconSrc} alt="WhiteKit" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tight leading-none">WhiteKit</h1>
            <p className="font-mono text-xs bg-ink text-canvas inline-block px-2 py-0.5 mt-2 font-bold">
              CONTROL_SURFACE // RESIDENCY_THEME
            </p>
          </div>
        </header>

        {/* Filters/Tabs */}
        <div className="mt-8 flex gap-4 border-b-4 border-ink pb-4 pl-2">
          {filterTabs.map((tab) => {
            const isActive = tab.id === activeFilter

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                aria-pressed={isActive}
                className={`
                  px-4 py-2 font-black uppercase text-sm border-2 border-ink
                  ${isActive
                    ? `bg-ink text-canvas ${surfacePressedClasses}`
                    : `bg-white text-ink shadow-brutal cursor-pointer ${surfaceInteractiveClasses}`}
                `}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Card Grid with Flexbox magic */}
        <div className="min-h-0 flex-1">
          <div className="h-full overflow-y-auto pl-2 pr-2">
            <div className="flex flex-wrap content-start gap-6 pt-6 pb-8">
            {filteredTools.map((tool) => {
              const isInstalled = tool.version !== null
              return (
                <div
                  key={tool.id}
                  onClick={() => toggleSelect(tool.id)}
                  className={`
                    group cursor-pointer border-4 border-ink p-5 flex flex-col w-[280px] min-h-[190px] relative overflow-hidden
                    ${tool.selected
                      ? `bg-accent-lime ${surfacePressedClasses}`
                      : `bg-white shadow-brutal ${surfaceInteractiveClasses}`}
                  `}
                >
                  {/* Status Badge overlay */}
                  <div className="absolute top-0 right-0 z-10">
                    <div className={`text-[10px] font-mono font-black px-2 py-1 tracking-widest border-b-4 border-l-4 border-ink flex items-center gap-1.5 transition-colors ${isInstalled ? 'bg-accent-lime text-ink normal-case' : 'bg-accent-magenta text-white uppercase'}`}>
                      {isInstalled ? `v${tool.version}` : 'not installed'}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex flex-col">
                      <img src={tool.iconSrc} alt="" aria-hidden="true" className="w-14 h-14 object-contain" />
                      <h3 className="text-xl font-black uppercase tracking-tight leading-tight mt-3">{tool.name}</h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs font-medium leading-tight opacity-90 h-8 overflow-hidden line-clamp-2 mt-4 relative z-10">
                    {tool.description}
                  </p>

                  {/* Bottom Bar: Checkbox moved here */}
                  <div className="mt-auto pt-3 flex justify-between items-center relative z-10 text-ink">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-0">Spacer</span>
                    {/* Checkbox */}
                    <div className="w-6 h-6 border-4 border-ink bg-white flex items-center justify-center">
                      {tool.selected && (
                        <svg
                          viewBox="0 0 16 16"
                          aria-hidden="true"
                          className="w-3.5 h-3.5"
                        >
                          <path
                            d="M3 8.5L6.5 12L13 4.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        </div>
      </section>

      {/* Right Section (20%) */}
      <aside className="w-[20%] p-8 flex flex-col gap-8 bg-white border-l-4 border-ink min-w-[300px]">
        <div>
          <h2 className="text-xs font-mono font-black uppercase tracking-widest mb-4 border-b-4 border-ink pb-2 italic">Network_Link</h2>
          <div className="flex items-center gap-3 p-3 border-4 border-ink bg-accent-lime shadow-brutal">
            <div className="w-4 h-4 bg-ink animate-[pulse_1s_infinite]"></div>
            <span className="text-sm font-black uppercase tracking-tight">System Online</span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-mono font-black uppercase tracking-widest mb-2 italic">Operations</h2>
            
            <button 
              disabled={!canInstall}
              className={`
                w-full py-4 border-4 border-ink font-black uppercase tracking-widest text-lg
                ${canInstall 
                  ? `bg-accent-lime shadow-brutal ${surfaceInteractiveClasses}` 
                  : 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed'}
              `}
            >
              {installText}
            </button>
            
            <button 
              disabled={!canUninstall}
              className={`
                w-full py-4 border-4 border-ink font-black uppercase tracking-widest text-lg
                ${canUninstall 
                  ? `bg-accent-magenta text-white shadow-brutal ${surfaceInteractiveClasses}` 
                  : 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed'}
              `}
            >
              {removeText}
            </button>
          </div>

          <div className="pt-4 border-t-2 border-ink border-dashed">
            <button
              className={`w-full py-4 border-4 border-ink font-black uppercase tracking-widest text-lg bg-white shadow-brutal flex items-center justify-center gap-3 ${surfaceInteractiveClasses}`}
            >
              <span>Terminal</span>
              <img src={terminalIcon} alt="" aria-hidden="true" className="w-5 h-5 object-contain" />
            </button>
          </div>
        </div>
      </aside>
    </main>
  )
}

export default App
