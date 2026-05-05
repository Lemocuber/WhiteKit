import { useEffect, useRef } from 'react'

import type { ProcessType } from '@/app/hooks/useToolProcessManager'
import { buttonInteractiveClasses, hoverHitboxClasses } from '@/app/ui'
import type { Tool, ToolId } from '@/lib/tools'

interface ProcessingViewProps {
  completedTasks: ToolId[]
  currentTaskId: ToolId | null
  failedTasks: ToolId[]
  isComplete: boolean
  onOkay: () => void
  processType: ProcessType
  taskQueue: ToolId[]
  tools: Tool[]
}

export function ProcessingView({
  completedTasks,
  currentTaskId,
  failedTasks,
  isComplete,
  onOkay,
  processType,
  taskQueue,
  tools,
}: ProcessingViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isComplete) return

    const frameId = window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current
      if (!container) return

      container.scrollTop = container.scrollHeight
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [isComplete])

  return (
    <div className="flex h-full flex-col z-10">
      <h2 className="mb-8 flex items-baseline text-5xl font-black uppercase tracking-tight">
        {processType === 'install' ? 'Installing' : 'Removing'} Tools
      </h2>

      <div
        ref={scrollContainerRef}
        className="relative flex-1 overflow-y-auto border-4 border-ink bg-white p-6 shadow-brutal"
      >
        <div className="absolute top-0 right-0 z-10">
          <div className="flex min-h-[32px] items-center border-b-4 border-l-4 border-ink bg-accent-lime px-2.5 py-1 text-xs font-mono font-black uppercase tracking-widest text-ink">
            PROGRESS_TRACKER
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-8">
          {taskQueue.map((toolId) => {
            const tool = tools.find((item) => item.id === toolId)

            if (!tool) return null

            const isDone = completedTasks.includes(toolId)
            const didFail = failedTasks.includes(toolId)
            const isCurrent = currentTaskId === toolId

            return (
              <div
                key={toolId}
                className="flex items-center gap-4 border-4 border-ink bg-white p-4 shadow-[4px_4px_0_0_#000]"
              >
                <img src={tool.iconSrc} alt="" className="h-12 w-12 object-contain" />
                <div className="flex-1">
                  <h3 className="text-2xl font-black uppercase tracking-tight">{tool.name}</h3>
                  <p className="mt-1 font-mono text-xs font-bold">
                    {didFail ? 'FAILED' : isDone ? 'COMPLETE' : isCurrent ? 'PROCESSING' : 'WAITING_IN_QUEUE'}
                  </p>
                </div>
                {(didFail || isDone || isCurrent) && (
                  <div className="mr-3 flex w-8 justify-center">
                    {didFail && (
                      <div className="flex h-8 w-8 items-center justify-center bg-accent-red text-white">
                        <span className="font-mono text-lg font-black leading-none">!</span>
                      </div>
                    )}
                    {isDone && (
                      <div className="flex h-8 w-8 items-center justify-center bg-ink text-canvas">
                        <svg viewBox="0 0 16 16" className="h-5 w-5">
                          <path
                            d="M3 8.5L6.5 12L13 4.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                          />
                        </svg>
                      </div>
                    )}
                    {isCurrent && (
                      <div
                        className="h-4 w-4 animate-[spin_1.4s_linear_infinite] bg-ink"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {isComplete && (
            <div className="flex flex-col items-center gap-4 pt-4 mb-12">
              <p className="text-center font-mono text-sm font-black uppercase tracking-widest">
                {completedTasks.length} {processType === 'install' ? 'installed' : 'removed'}, {failedTasks.length} failed
              </p>
              <div className={hoverHitboxClasses}>
                <button
                  type="button"
                  onClick={onOkay}
                  className={`min-w-[180px] border-4 border-ink bg-accent-lime px-10 py-4 text-lg font-black uppercase tracking-widest shadow-brutal ${buttonInteractiveClasses}`}
                >
                  Okay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
