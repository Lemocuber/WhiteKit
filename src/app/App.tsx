import { useState } from 'react'

interface Tool {
  id: string
  name: string
  icon: string
  version: string | null
  selected: boolean
}

function App() {
  const [tools, setTools] = useState<Tool[]>([
    { id: 'nodejs', name: 'Node.js', icon: '🟢', version: '20.11.0', selected: false },
    { id: 'python', name: 'Python', icon: '🐍', version: '3.12.2', selected: false },
    { id: 'git', name: 'Git', icon: '🔀', version: '2.44.0', selected: false },
    { id: 'claude', name: 'Claude Code', icon: '🤖', version: null, selected: false },
    { id: 'codex', name: 'Codex', icon: '📖', version: null, selected: false },
    { id: 'terminal', name: 'Terminal', icon: '🐚', version: 'Zsh', selected: false },
  ])

  const toggleSelect = (id: string) => {
    setTools(tools.map(t => t.id === id ? { ...t, selected: !t.selected } : t))
  }

  const selectedTools = tools.filter(t => t.selected)
  const selectedCount = selectedTools.length
  
  // Uninstall is enabled only when ALL selected items are currently installed (version is not null)
  const canUninstall = selectedCount > 0 && selectedTools.every(t => t.version !== null)
  const canInstall = selectedCount > 0

  return (
    <main className="min-h-screen bg-canvas text-ink font-display flex flex-col md:flex-row border-ink">
      
      {/* Main Section (80%) */}
      <section className="w-full md:w-4/5 p-8 flex flex-col gap-8 overflow-y-auto">
        <header className="flex items-center gap-6">
          <div className="w-20 h-20 bg-accent-lime border-4 border-ink shadow-brutal flex items-center justify-center text-4xl font-bold transition-transform hover:-rotate-3">
            WK
          </div>
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">WhiteKit</h1>
            <p className="font-mono text-sm bg-ink text-canvas inline-block px-2 py-1 mt-2">
              Hard Brutalist Dev Environment Manager
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <div 
              key={tool.id}
              onClick={() => toggleSelect(tool.id)}
              className={`
                group cursor-pointer border-4 border-ink p-6 flex items-center gap-6 transition-all
                ${tool.selected 
                  ? 'bg-accent-lime translate-x-1 translate-y-1 shadow-none' 
                  : 'bg-white shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg'}
              `}
            >
              <div className="text-5xl">{tool.icon}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-black uppercase tracking-tight">{tool.name}</h3>
                <p className="text-xs font-mono font-bold uppercase opacity-70">
                  {tool.version ? `v${tool.version}` : 'Not Installed'}
                </p>
              </div>
              <div className={`w-10 h-10 border-4 border-ink flex items-center justify-center font-black text-xl ${tool.selected ? 'bg-ink text-canvas' : 'bg-white'}`}>
                {tool.selected ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Right Section (20%) - Serious Status & Actions */}
      <aside className="w-full md:w-1/5 border-t-4 md:border-t-0 md:border-l-4 border-ink p-8 flex flex-col gap-8 bg-white">
        <div>
          <h2 className="text-xs font-mono font-black uppercase tracking-[0.2em] mb-4 border-b-2 border-ink pb-2">Network Architecture</h2>
          <div className="flex items-center gap-3 p-3 border-4 border-ink bg-accent-lime shadow-brutal">
            <div className="w-4 h-4 bg-ink animate-pulse"></div>
            <span className="text-sm font-black uppercase">Status: Online</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-mono font-black uppercase tracking-[0.2em] mb-2">Core Commands</h2>
          <button 
            disabled={!canInstall}
            className={`
              w-full py-5 px-2 border-4 border-ink font-black uppercase tracking-widest text-xl transition-all
              ${canInstall 
                ? 'bg-accent-lime shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-none' 
                : 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed'}
            `}
          >
            Deploy ({selectedCount})
          </button>
          
          <button 
            disabled={!canUninstall}
            className={`
              w-full py-5 px-2 border-4 border-ink font-black uppercase tracking-widest text-xl transition-all
              ${canUninstall 
                ? 'bg-accent-magenta text-white shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-none' 
                : 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed'}
            `}
          >
            Purge
          </button>
        </div>

        <div className="mt-auto">
          <h3 className="text-xs font-mono font-black uppercase mb-3">System Log</h3>
          <div className="border-4 border-ink p-4 bg-ink text-accent-lime font-mono text-[10px] leading-tight shadow-brutal">
            {selectedCount > 0 
              ? `> QUEUED: ${selectedTools.map(t => t.name.toUpperCase()).join(', ')}\n> READY FOR DEPLOYMENT...` 
              : '> SYSTEM IDLE\n> STANDING BY...'}
          </div>
        </div>
      </aside>
    </main>
  )
}

export default App
