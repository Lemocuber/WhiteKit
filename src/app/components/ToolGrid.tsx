import { brandIconSrc, buttonInteractiveClasses, cardInteractiveClasses, hoverHitboxClasses, surfacePressedClasses } from '@/app/ui'
import {
  getNextToolFilter,
  isToolInstalled,
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
  const headerFilter = getHeaderFilterPresentation(activeFilter)

  return (
    <>
      <header className="mb-6 flex items-center gap-5 pl-2">
        <div className={hoverHitboxClasses}>
          <button
            type="button"
            onClick={() => onFilterChange(getNextToolFilter(activeFilter))}
            aria-label={headerFilter.ariaLabel}
            title={headerFilter.title}
            className={`flex h-20 w-20 cursor-pointer items-center justify-center border-4 border-ink p-2.5 shadow-brutal ${headerFilter.classes} ${buttonInteractiveClasses}`}
          >
            <img
              src={brandIconSrc}
              alt=""
              aria-hidden="true"
              className={`h-full w-full object-contain ${headerFilter.iconClasses}`}
            />
          </button>
        </div>
        <div>
          <h1 className="text-6xl leading-[0.9] font-black uppercase tracking-tight">小白箱 WhiteKit</h1>
          <p className="mt-2 inline-block bg-ink px-2 py-0.5 font-mono text-xs font-bold text-canvas">
            开发环境配置 // 冷启动工具箱
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <div className="h-full overflow-y-auto border-t-4 border-ink px-2 pt-6">
          <div className="flex flex-wrap content-start gap-6 pb-8">
            {tools.map((tool) => {
              const badge = getStatusBadge(tool)

              return (
                <div key={tool.id} className={hoverHitboxClasses}>
                  <button
                    type="button"
                    onClick={() => onToolToggle(tool.id)}
                    className={`relative flex min-h-[190px] w-[280px] cursor-pointer flex-col overflow-hidden border-4 border-ink px-5 pt-4 pb-14 text-left ${
                      tool.selected
                        ? `bg-accent-lime ${surfacePressedClasses}`
                        : `bg-white shadow-brutal ${cardInteractiveClasses}`
                    }`}
                  >
                    <div className="absolute top-0 right-0 z-10">
                      <div
                        className={`flex min-h-[32px] items-center gap-1.5 border-b-4 border-l-4 border-ink px-2.5 py-1 text-xs font-mono font-black tracking-widest transition-colors ${
                          badge.classes
                        }`}
                      >
                        {badge.label}
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

                    <p className="relative z-10 mt-1 h-8 overflow-hidden text-xs font-medium leading-tight opacity-90 line-clamp-2">
                      {tool.description}
                    </p>

                    <div className="absolute right-5 bottom-5 z-10 text-ink">
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

function getHeaderFilterPresentation(filter: ToolFilter) {
  if (filter === 'installed') {
    return {
      classes: 'bg-accent-lime text-ink',
      iconClasses: '',
      ariaLabel: '筛选：已安装。点击查看未安装',
      title: '已安装',
    }
  }

  if (filter === 'available') {
    return {
      classes: 'bg-accent-magenta text-white',
      iconClasses: 'brightness-0 invert',
      ariaLabel: '筛选：未安装。点击查看全部',
      title: '未安装',
    }
  }

  return {
    classes: 'bg-white text-ink',
    iconClasses: '',
    ariaLabel: '筛选：全部。点击查看已安装',
    title: '全部',
  }
}

function getStatusBadge(tool: Tool) {
  if (tool.status === 'checking') {
    return { label: '检测中', classes: 'bg-white text-ink uppercase' }
  }

  if (tool.status === 'processing') {
    return { label: '处理中', classes: 'bg-ink text-canvas uppercase' }
  }

  if (isToolInstalled(tool)) {
    return { label: `v${tool.version}`, classes: 'bg-accent-lime text-ink normal-case' }
  }

  return { label: '未安装', classes: 'bg-accent-magenta text-white uppercase' }
}
