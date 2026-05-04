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
  ])

  const toggleSelect = (id: string) => {
    setTools(tools.map(t => t.id === id ? { ...t, selected: !t.selected } : t))
  }

  const selectedCount = tools.filter(t => t.selected).length

  return (
    <main className="min-h-screen bg-canvas text-ink font-display flex flex-col md:flex-row border-ink">
      {/* Left Section (20%) */}
      <aside className="w-full md:w-1/5 border-b-4 md:border-b-0 md:border-r-4 border-ink p-6 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="w-16 h-16 bg-accent-yellow border-4 border-ink shadow-brutal flex items-center justify-center text-3xl font-bold">
            WK
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">WhiteKit</h1>
            <p className="text-xs font-mono uppercase">Dev Env Manager</p>
          </div>
        </div>

        <div className="mt-auto pt-8 border-t-2 border-ink">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent-green border-2 border-ink"></div>
            <span className="text-xs font-black uppercase tracking-widest">Network: Online</span>
          </div>
        </div>
      </aside>

      {/* Middle Section (60%) */}
      <section className="w-full md:w-3/5 p-6 flex flex-col gap-6 overflow-y-auto">
        <header className="mb-4">
          <h2 className="text-4xl font-black uppercase italic tracking-tight">Main Experience</h2>
          <p className="font-mono text-sm bg-ink text-canvas inline-block px-2 py-1 mt-2">
            Select tools to manage your environment
          </p>
        </header>

        <div className="grid gap-4">
          {tools.map((tool) => (
            <div 
              key={tool.id}
              onClick={() => toggleSelect(tool.id)}
              className={`
                group cursor-pointer border-4 border-ink p-4 flex items-center gap-4 transition-all
                ${tool.selected ? 'bg-accent-blue translate-x-1 translate-y-1 shadow-none' : 'bg-white shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg'}
              `}
            >
              <div className="text-4xl">{tool.icon}</div>
              <div className="flex-1">
                <h3 className="text-xl font-black uppercase">{tool.name}</h3>
                <p className="text-xs font-mono">
                  {tool.version ? `v${tool.version}` : 'Not Installed'}
                </p>
              </div>
              <div className={`w-8 h-8 border-4 border-ink flex items-center justify-center font-black ${tool.selected ? 'bg-ink text-canvas' : 'bg-white'}`}>
                {tool.selected ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Right Section (20%) */}
      <aside className="w-full md:w-1/5 border-t-4 md:border-t-0 md:border-l-4 border-ink p-6 flex flex-col gap-6">
        <h2 className="text-xl font-black uppercase tracking-tighter border-b-4 border-ink pb-2">Actions</h2>
        
        <div className="flex flex-col gap-4">
          <button 
            disabled={selectedCount === 0}
            className={`
              w-full py-4 px-2 border-4 border-ink font-black uppercase tracking-widest text-lg transition-all
              ${selectedCount > 0 
                ? 'bg-accent-green shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-none' 
                : 'bg-gray-300 opacity-50 cursor-not-allowed'}
            `}
          >
            Install ({selectedCount})
          </button>
          
          <button 
            className="w-full py-4 px-2 border-4 border-ink font-black uppercase tracking-widest text-lg bg-white shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-none"
          >
            Uninstall
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-xs font-mono uppercase mb-2">Status</h3>
          <div className="border-4 border-ink p-4 bg-ink text-canvas font-mono text-xs">
            {selectedCount > 0 
              ? `Waiting to install ${selectedCount} items...` 
              : 'System idle. Ready for command.'}
          </div>
        </div>
      </aside>
    </main>
  )
}

export default App
