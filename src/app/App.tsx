import { useEffect, useRef, useState } from 'react'

import terminalIcon from '@/assets/tools/terminal.svg'
import {
  createInitialTools,
  getFilteredTools,
  getToolSelectionState,
  isToolInstalled,
  toggleToolSelection,
  toolFilterTabs,
  type ToolFilter,
  type ToolId,
} from '@/lib/tools'

const brandIconSrc = '/brand/whitekit.svg'
const hoverHitboxClasses = 'group pt-0.5 pl-0.5 -mt-0.5 -ml-0.5'
const buttonInteractiveClasses = 'group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[6px_6px_0_0_#000] group-active:translate-x-0.5 group-active:translate-y-0.5 group-active:shadow-[2px_2px_0_0_#000]'
const cardInteractiveClasses = 'group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[6px_6px_0_0_#000] group-active:translate-x-0.5 group-active:translate-y-0.5 group-active:shadow-[2px_2px_0_0_#000]'
const surfacePressedClasses = 'translate-x-0.5 translate-y-0.5 shadow-[2px_2px_0_0_#000]'

function App() {
  const [activeFilter, setActiveFilter] = useState<ToolFilter>('all')
  const [tools, setTools] = useState(createInitialTools)

  const [currentSpeed, setCurrentSpeed] = useState(0)
  const polylineRef = useRef<SVGPolylineElement>(null)

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false)
  const [processType, setProcessType] = useState<'install' | 'remove' | null>(null)
  const [taskQueue, setTaskQueue] = useState<ToolId[]>([])
  const [pendingTasks, setPendingTasks] = useState<ToolId[]>([])
  const [completedTasks, setCompletedTasks] = useState<ToolId[]>([])
  const [dots, setDots] = useState('')

  // Animated dots
  useEffect(() => {
    if (!isProcessing) return
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 400)
    return () => clearInterval(interval)
  }, [isProcessing])

  // Processing mock
  useEffect(() => {
    if (isProcessing && pendingTasks.length > 0) {
      const timer = setTimeout(() => {
        const nextTask = pendingTasks[0]
        setPendingTasks((prev) => prev.slice(1))
        setCompletedTasks((prev) => [...prev, nextTask])
        
        setTools((current) =>
          current.map((t) =>
            t.id === nextTask
              ? { ...t, version: processType === 'install' ? 'latest' : null, selected: false }
              : t
          )
        )
      }, Math.random() * 1500 + 800)
      return () => clearTimeout(timer)
    } else if (isProcessing && pendingTasks.length === 0) {
      const timer = setTimeout(() => {
        setIsProcessing(false)
        setProcessType(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isProcessing, pendingTasks, processType])

  useEffect(() => {
    let lastTime = performance.now()
    let offset = 0
    let history = Array(22).fill(0)
    let nextValue = Math.floor(Math.random() * 2000)
    let animationFrameId: number

    const tick = (time: number) => {
      const delta = time - lastTime
      lastTime = time

      offset += (delta / 1000) * 5

      if (offset >= 5) {
        offset %= 5
        history = [...history.slice(1), nextValue]
        setCurrentSpeed(nextValue)
        nextValue = Math.floor(Math.random() * 2000)
      }

      if (polylineRef.current) {
        const points = history.map((val, i) => `${(i * 5) - offset},${100 - (val / 2000) * 100}`).join(' ')
        polylineRef.current.setAttribute('points', points)
      }

      animationFrameId = requestAnimationFrame(tick)
    }

    animationFrameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  const handleToolToggle = (id: ToolId) => {
    if (isProcessing) return
    setTools((currentTools) => toggleToolSelection(currentTools, id))
  }

  const startProcess = (type: 'install' | 'remove') => {
    const toolsToProcess = tools
      .filter((t) => t.selected && (type === 'install' ? !isToolInstalled(t) : isToolInstalled(t)))
      .map((t) => t.id)
    
    if (toolsToProcess.length === 0) return

    setIsProcessing(true)
    setProcessType(type)
    setTaskQueue(toolsToProcess)
    setPendingTasks(toolsToProcess)
    setCompletedTasks([])
  }

  const filteredTools = getFilteredTools(tools, activeFilter)
  const {
    canInstall,
    canUninstall,
    selectedInstalledCount,
    selectedMissingCount,
  } = getToolSelectionState(tools)
  
  const installText = canInstall ? `Install (${selectedMissingCount})` : 'Install'
  const removeText = canUninstall ? `Remove (${selectedInstalledCount})` : 'Remove'

  return (
    <main className="h-screen bg-canvas text-ink font-sans flex border-ink overflow-hidden select-none">
      
      {/* Main Section (80%) */}
      <section className="w-[80%] min-h-0 p-8 flex flex-col overflow-hidden border-r-4 border-ink relative">
        {isProcessing ? (
          <div className="flex flex-col h-full z-10">
            <h2 className="text-5xl font-black uppercase tracking-tight mb-8 flex items-baseline">
              {processType === 'install' ? 'Installing' : 'Removing'} Tools
            </h2>
            
            <div className="flex-1 overflow-y-auto border-4 border-ink p-6 shadow-brutal bg-white relative">
              <div className="absolute top-0 right-0 z-10">
                <div className="bg-accent-lime text-ink text-[10px] font-mono font-black px-2 py-1 tracking-widest border-b-4 border-l-4 border-ink uppercase">
                  PROGRESS_TRACKER
                </div>
              </div>
              <div className="flex flex-col gap-4 pt-4">
                {taskQueue.map((toolId) => {
                  const tool = tools.find((t) => t.id === toolId)!
                  const isDone = completedTasks.includes(toolId)
                  const isCurrent = pendingTasks[0] === toolId
                  
                  return (
                    <div key={toolId} className="flex items-center gap-4 p-4 border-4 border-ink bg-white shadow-[4px_4px_0_0_#000]">
                       <img src={tool.iconSrc} alt="" className="w-12 h-12 object-contain" />
                       <div className="flex-1">
                         <h3 className="text-2xl font-black uppercase tracking-tight">{tool.name}</h3>
                         <p className="font-mono text-xs font-bold mt-1">
                           {isDone ? 'COMPLETE' : isCurrent ? 'PROCESSING' : 'WAITING_IN_QUEUE'}
                         </p>
                       </div>
                       {(isDone || isCurrent) && (
                         <div className="mr-3 flex w-8 justify-center">
                           {isDone && (
                             <div className="w-8 h-8 bg-ink text-canvas flex items-center justify-center">
                               <svg viewBox="0 0 16 16" className="w-5 h-5"><path d="M3 8.5L6.5 12L13 4.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"/></svg>
                             </div>
                           )}
                           {isCurrent && (
                             <div className="w-4 h-4 bg-ink animate-[spin_1.4s_linear_infinite]" aria-hidden="true" />
                           )}
                         </div>
                       )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
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
              {toolFilterTabs.map((tab) => {
                const isActive = tab.id === activeFilter

                return (
                  <div key={tab.id} className={hoverHitboxClasses}>
                    <button
                      type="button"
                      onClick={() => setActiveFilter(tab.id)}
                      aria-pressed={isActive}
                      className={`
                        px-4 py-2 font-black uppercase text-sm border-2 border-ink
                        ${isActive
                          ? `bg-ink text-canvas ${surfacePressedClasses}`
                          : `bg-white text-ink shadow-brutal cursor-pointer ${buttonInteractiveClasses}`}
                      `}
                    >
                      {tab.label}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Card Grid */}
            <div className="min-h-0 flex-1">
              <div className="h-full overflow-y-auto pl-2 pr-2">
                <div className="flex flex-wrap content-start gap-6 pt-6 pb-8">
                {filteredTools.map((tool) => {
                  const isInstalled = isToolInstalled(tool)
                  return (
                    <div key={tool.id} className={hoverHitboxClasses}>
                      <div
                        onClick={() => handleToolToggle(tool.id)}
                        className={`
                          cursor-pointer border-4 border-ink p-5 flex flex-col w-[280px] min-h-[190px] relative overflow-hidden
                          ${tool.selected
                            ? `bg-accent-lime ${surfacePressedClasses}`
                            : `bg-white shadow-brutal ${cardInteractiveClasses}`}
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

                        {/* Bottom Bar */}
                        <div className="mt-auto pt-3 flex justify-between items-center relative z-10 text-ink">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-0">Spacer</span>
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
                    </div>
                  )
                })}
                </div>
              </div>
            </div>
          </>
        )}
        <div aria-hidden="true" className="pointer-events-none absolute bottom-8 left-8 right-8 border-b-4 border-ink" />
      </section>

      {/* Right Section (20%) */}
      <aside className="w-[20%] p-8 flex flex-col gap-8 bg-white border-l-4 border-ink min-w-[300px]">
        <div>
          <h2 className="text-xs font-mono font-black uppercase tracking-widest mb-4 border-b-4 border-ink pb-2 italic">Network_Link</h2>
          <div className="flex items-center gap-3 p-3 border-4 border-ink bg-accent-lime shadow-brutal">
            <div className="w-4 h-4 bg-ink"></div>
            <span className="text-sm font-black uppercase tracking-tight">System Online</span>
          </div>

          <div className="mt-4">
            <div className="flex flex-col gap-2 p-3 border-4 border-ink bg-white shadow-brutal">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase tracking-widest">Speed</span>
                <span className="font-mono font-black">{currentSpeed} KB/s</span>
              </div>
              <div className="h-16 border-t-2 border-dashed border-ink pt-2 overflow-hidden">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <polyline
                    ref={polylineRef}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinejoin="miter"
                    strokeLinecap="square"
                    vectorEffect="non-scaling-stroke"
                    className="text-ink"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className={hoverHitboxClasses}>
              <button 
                onClick={() => startProcess('remove')}
                disabled={!canUninstall || isProcessing}
                className={`
                  w-full py-4 border-4 border-ink font-black uppercase tracking-widest text-lg
                  ${(canUninstall && !isProcessing)
                    ? `bg-accent-magenta text-white shadow-brutal ${buttonInteractiveClasses}` 
                    : (isProcessing && processType === 'remove')
                      ? 'bg-accent-magenta text-white shadow-brutal'
                      : 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed'}
                `}
              >
                {isProcessing && processType === 'remove' ? `Removing${dots}` : removeText}
              </button>
            </div>
            
            <div className={hoverHitboxClasses}>
              <button 
                onClick={() => startProcess('install')}
                disabled={!canInstall || isProcessing}
                className={`
                  w-full py-4 border-4 border-ink font-black uppercase tracking-widest text-lg
                  ${(canInstall && !isProcessing)
                    ? `bg-accent-lime shadow-brutal ${buttonInteractiveClasses}` 
                    : (isProcessing && processType === 'install')
                      ? 'bg-accent-lime shadow-brutal'
                      : 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed'}
                `}
              >
                {isProcessing && processType === 'install' ? `Installing${dots}` : installText}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-ink border-dashed">
            <div className={hoverHitboxClasses}>
              <button
                className={`w-full py-4 border-4 border-ink font-black uppercase tracking-widest text-lg bg-white shadow-brutal flex items-center justify-center gap-3 ${buttonInteractiveClasses}`}
              >
                <span>Terminal</span>
                <img src={terminalIcon} alt="" aria-hidden="true" className="w-5 h-5 object-contain" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </main>
  )
}

export default App
