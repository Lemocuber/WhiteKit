import { brandIconSrc, buttonInteractiveClasses, cardInteractiveClasses, hoverHitboxClasses, surfacePressedClasses } from '@/app/ui'
import {
  isToolInstalled,
  toolFilterTabs,
  type Tool,
  type ToolFilter,
  type ToolId,
} from '@/lib/tools'

interface ToolGridProps {
  activeFilter: ToolFilter
  onFilterChange: (filter: ToolFilter) => void
  onToolToggle: (id: ToolId) => void
  tools: Tool[]
}

export function ToolGrid({
  activeFilter,
  onFilterChange,
  onToolToggle,
  tools,
}: ToolGridProps) {
  return (
    <>
      <header className="flex items-center gap-4 pl-2">
        <div className="flex h-16 w-16 items-center justify-center border-4 border-ink bg-accent-lime p-2 shadow-brutal">
          <img src={brandIconSrc} alt="WhiteKit" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tight leading-none">WhiteKit</h1>
          <p className="mt-2 inline-block bg-ink px-2 py-0.5 font-mono text-xs font-bold text-canvas">
            CONTROL_SURFACE // RESIDENCY_THEME
          </p>
        </div>
      </header>

      <div className="mt-8 flex gap-4 border-b-4 border-ink pb-4 pl-2">
        {toolFilterTabs.map((tab) => {
          const isActive = tab.id === activeFilter

          return (
            <div key={tab.id} className={hoverHitboxClasses}>
              <button
                type="button"
                onClick={() => onFilterChange(tab.id)}
                aria-pressed={isActive}
                className={`border-2 border-ink px-4 py-2 text-sm font-black uppercase ${
                  isActive
                    ? `bg-ink text-canvas ${surfacePressedClasses}`
                    : `cursor-pointer bg-white text-ink shadow-brutal ${buttonInteractiveClasses}`
                }`}
              >
                {tab.label}
              </button>
            </div>
          )
        })}
      </div>

      <div className="min-h-0 flex-1">
        <div className="h-full overflow-y-auto px-2">
          <div className="flex flex-wrap content-start gap-6 pt-6 pb-8">
            {tools.map((tool) => {
              const isInstalled = isToolInstalled(tool)

              return (
                <div key={tool.id} className={hoverHitboxClasses}>
                  <button
                    type="button"
                    onClick={() => onToolToggle(tool.id)}
                    className={`relative flex min-h-[190px] w-[280px] cursor-pointer flex-col overflow-hidden border-4 border-ink p-5 text-left ${
                      tool.selected
                        ? `bg-accent-lime ${surfacePressedClasses}`
                        : `bg-white shadow-brutal ${cardInteractiveClasses}`
                    }`}
                  >
                    <div className="absolute top-0 right-0 z-10">
                      <div
                        className={`flex min-h-[32px] items-center gap-1.5 border-b-4 border-l-4 border-ink px-2.5 py-1 text-xs font-mono font-black tracking-widest transition-colors ${
                          isInstalled
                            ? 'bg-accent-lime text-ink normal-case'
                            : 'bg-accent-magenta text-white uppercase'
                        }`}
                      >
                        {isInstalled ? `v${tool.version}` : 'not installed'}
                      </div>
                    </div>

                    <div className="relative z-10 flex items-start justify-between">
                      <div className="flex flex-col">
                        <img src={tool.iconSrc} alt="" aria-hidden="true" className="h-14 w-14 object-contain" />
                        <h3 className="mt-3 text-xl font-black uppercase tracking-tight leading-tight">
                          {tool.name}
                        </h3>
                      </div>
                    </div>

                    <p className="relative z-10 mt-4 h-8 overflow-hidden text-xs font-medium leading-tight opacity-90 line-clamp-2">
                      {tool.description}
                    </p>

                    <div className="relative z-10 mt-auto flex items-center justify-between pt-3 text-ink">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-0">Spacer</span>
                      <div className="flex h-6 w-6 items-center justify-center border-4 border-ink bg-white">
                        {tool.selected && (
                          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
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
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
