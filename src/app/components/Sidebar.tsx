import terminalIcon from '@/assets/tools/terminal.svg'
import { useNetworkTelemetry } from '@/app/hooks/useNetworkTelemetry'
import type { ProcessType } from '@/app/hooks/useToolProcessManager'
import { buttonInteractiveClasses, hoverHitboxClasses } from '@/app/ui'

interface SidebarProps {
  canInstall: boolean
  canUninstall: boolean
  dots: string
  installText: string
  isProcessing: boolean
  processType: ProcessType | null
  removeText: string
  startProcess: (type: ProcessType) => void
}

export function Sidebar({
  canInstall,
  canUninstall,
  dots,
  installText,
  isProcessing,
  processType,
  removeText,
  startProcess,
}: SidebarProps) {
  const { networkState, currentSpeed, polylineRef } = useNetworkTelemetry()
  const networkPanelClasses = networkState === 'online'
    ? 'bg-accent-lime text-ink'
    : networkState === 'offline'
      ? 'bg-accent-red text-white'
      : 'bg-white text-ink'
  const networkLabel = networkState === 'online'
    ? 'System Online'
    : networkState === 'offline'
      ? 'Network Error'
      : 'Connecting'

  return (
    <aside className="w-[20%] min-w-[300px] border-l-4 border-ink bg-white p-8 flex flex-col gap-8">
      <div>
        <h2 className="mb-4 border-b-4 border-ink pb-2 text-xs font-mono font-black uppercase tracking-widest italic">
          Network_Link
        </h2>
        <div
          className={`flex min-h-[68px] items-center gap-4 border-4 border-ink px-4 py-3 shadow-brutal ${networkPanelClasses}`}
        >
          <div
            className={`h-5 w-5 border-2 border-ink ${
              networkState === 'checking'
                ? 'animate-pulse bg-white'
                : networkState === 'offline'
                  ? 'bg-white'
                  : 'bg-ink'
            }`}
          />
          <span className="text-lg font-black uppercase tracking-tight">{networkLabel}</span>
        </div>

        <div className="mt-4">
          {networkState === 'offline' ? (
            <div className="flex flex-col justify-between border-4 border-ink bg-accent-red p-3 text-white shadow-brutal">
              <p className="text-lg font-black uppercase leading-tight tracking-tight">
                Network failure. Check your connection
              </p>
            </div>
          ) : (
            <div className="flex min-h-[128px] flex-col gap-2 border-4 border-ink bg-white p-3 shadow-brutal">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest">Speed</span>
                <span className="font-mono font-black">
                  {networkState === 'online' ? `${currentSpeed} KB/s` : '...'}
                </span>
              </div>
              <div className="h-16 overflow-hidden border-t-2 border-dashed border-ink pt-2">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
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
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className={hoverHitboxClasses}>
            <button
              type="button"
              onClick={() => startProcess('remove')}
              disabled={!canUninstall || isProcessing}
              className={`w-full border-4 border-ink py-4 text-lg font-black uppercase tracking-widest ${
                canUninstall && !isProcessing
                  ? `bg-accent-magenta text-white shadow-brutal ${buttonInteractiveClasses}`
                  : isProcessing && processType === 'remove'
                    ? 'bg-accent-magenta text-white shadow-brutal'
                    : 'cursor-not-allowed border-gray-400 bg-gray-200 text-gray-400'
              }`}
            >
              {isProcessing && processType === 'remove' ? `Removing${dots}` : removeText}
            </button>
          </div>

          <div className={hoverHitboxClasses}>
            <button
              type="button"
              onClick={() => startProcess('install')}
              disabled={!canInstall || isProcessing}
              className={`w-full border-4 border-ink py-4 text-lg font-black uppercase tracking-widest ${
                canInstall && !isProcessing
                  ? `bg-accent-lime shadow-brutal ${buttonInteractiveClasses}`
                  : isProcessing && processType === 'install'
                    ? 'bg-accent-lime shadow-brutal'
                    : 'cursor-not-allowed border-gray-400 bg-gray-200 text-gray-400'
              }`}
            >
              {isProcessing && processType === 'install' ? `Installing${dots}` : installText}
            </button>
          </div>
        </div>

        <div className="border-t-2 border-dashed border-ink pt-4">
          <div className={hoverHitboxClasses}>
            <button
              type="button"
              className={`flex w-full items-center justify-center gap-3 border-4 border-ink bg-white py-4 text-lg font-black uppercase tracking-widest shadow-brutal ${buttonInteractiveClasses}`}
            >
              <span>Terminal</span>
              <img src={terminalIcon} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
