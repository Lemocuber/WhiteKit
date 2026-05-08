import terminalIcon from '@/assets/tools/terminal.svg'
import { useNetworkTelemetry } from '@/app/hooks/useNetworkTelemetry'
import type { ProcessType } from '@/app/hooks/useToolProcessManager'
import { buttonInteractiveClasses, hoverHitboxClasses } from '@/app/ui'
import { launchTerminal } from '@/lib/shell'

interface SidebarProps {
  canConfigure: boolean
  canInstall: boolean
  canUninstall: boolean
  configureText: string
  dots: string
  installText: string
  isConfigViewOpen: boolean
  isSavingConfig: boolean
  isProcessViewOpen: boolean
  isRunningProcess: boolean
  onConfigure: () => void
  processType: ProcessType | null
  removeText: string
  startProcess: (type: ProcessType) => void
}

export function Sidebar({
  canConfigure,
  canInstall,
  canUninstall,
  configureText,
  dots,
  installText,
  isConfigViewOpen,
  isSavingConfig,
  isProcessViewOpen,
  isRunningProcess,
  onConfigure,
  processType,
  removeText,
  startProcess,
}: SidebarProps) {
  const { networkState, currentSpeedLabel, polylineRef } = useNetworkTelemetry()
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
  const isActionLocked = isProcessViewOpen || isConfigViewOpen || isSavingConfig

  const handleTerminalClick = () => {
    if (isActionLocked) return

    void launchTerminal().catch((error) => {
      console.error('Failed to launch terminal', error)
    })
  }

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
                  {networkState === 'online' ? currentSpeedLabel : '...'}
                </span>
              </div>
              <div className="top-dash-separator h-16 overflow-hidden pt-2">
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
              disabled={!canUninstall || isActionLocked}
              className={`w-full border-4 border-ink py-4 text-lg font-black uppercase tracking-widest ${
                canUninstall && !isActionLocked
                  ? `bg-accent-magenta text-white shadow-brutal ${buttonInteractiveClasses}`
                  : isProcessViewOpen && processType === 'remove'
                    ? 'bg-accent-magenta text-white shadow-brutal'
                    : 'cursor-not-allowed border-gray-400 bg-gray-200 text-gray-400'
              }`}
            >
              {isRunningProcess && processType === 'remove' ? `Removing${dots}` : removeText}
            </button>
          </div>

          <div className={hoverHitboxClasses}>
            <button
              type="button"
              onClick={onConfigure}
              disabled={!canConfigure || isActionLocked}
              className={`w-full border-4 border-ink py-4 text-lg font-black uppercase tracking-widest ${
                canConfigure && !isActionLocked
                  ? `bg-accent-blue text-white shadow-brutal ${buttonInteractiveClasses}`
                  : isConfigViewOpen
                    ? 'bg-accent-blue text-white shadow-brutal'
                    : 'cursor-not-allowed border-gray-400 bg-gray-200 text-gray-400'
              }`}
            >
              {isSavingConfig ? 'Saving' : configureText}
            </button>
          </div>

          <div className={hoverHitboxClasses}>
            <button
              type="button"
              onClick={() => startProcess('install')}
              disabled={!canInstall || isActionLocked}
              className={`w-full border-4 border-ink py-4 text-lg font-black uppercase tracking-widest ${
                canInstall && !isActionLocked
                  ? `bg-accent-lime shadow-brutal ${buttonInteractiveClasses}`
                  : isProcessViewOpen && processType === 'install'
                    ? 'bg-accent-lime shadow-brutal'
                    : 'cursor-not-allowed border-gray-400 bg-gray-200 text-gray-400'
              }`}
            >
              {isRunningProcess && processType === 'install' ? `Installing${dots}` : installText}
            </button>
          </div>
        </div>

        <div className="top-dash-separator pt-4">
          <div className={hoverHitboxClasses}>
            <button
              type="button"
              onClick={handleTerminalClick}
              disabled={isActionLocked}
              className={`flex w-full items-center justify-center gap-3 border-4 border-ink py-4 text-lg font-black uppercase tracking-widest ${
                isActionLocked
                  ? 'cursor-not-allowed border-gray-400 bg-gray-200 text-gray-400'
                  : `bg-white shadow-brutal ${buttonInteractiveClasses}`
              }`}
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
