import { useState, type FormEvent } from 'react'

import { buttonInteractiveClasses, hoverHitboxClasses } from '@/app/ui'
import {
  getToolConfigValidationErrors,
  type ToolConfigInput,
  type ToolConfigTarget,
  type ToolConfigValidationErrors,
} from '@/lib/toolConfig'

interface ConfigViewProps {
  configError: string | null
  initialInput: ToolConfigInput
  isLoading: boolean
  isSaving: boolean
  onCancel: () => void
  onDismissError: () => void
  onSave: (input: ToolConfigInput) => Promise<void>
  target: ToolConfigTarget
}

export function ConfigView({
  configError,
  initialInput,
  isLoading,
  isSaving,
  onCancel,
  onDismissError,
  onSave,
  target,
}: ConfigViewProps) {
  const [baseUrl, setBaseUrl] = useState(initialInput.baseUrl)
  const [model, setModel] = useState(initialInput.model)
  const [apiKey, setApiKey] = useState(initialInput.apiKey)
  const [errors, setErrors] = useState<ToolConfigValidationErrors>({})
  const controlsDisabled = isLoading || isSaving || Boolean(configError)
  const toolName = target === 'codex' ? 'Codex' : 'Claude Code'

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const nextErrors = getToolConfigValidationErrors({ baseUrl, apiKey, model })
    setErrors(nextErrors)

    if (nextErrors.baseUrl || nextErrors.apiKey) return

    void onSave({ baseUrl, apiKey, model })
  }

  return (
    <div className="z-10 flex h-full flex-col">
      <header className="mb-8 flex items-end justify-between gap-6">
        <h2 className="text-5xl font-black uppercase leading-none tracking-tight">
          Configure {toolName.split(' ')[0]}
        </h2>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto border-4 border-ink bg-white p-6 shadow-brutal">
        <div className="absolute top-0 right-0 z-10">
          <div className="flex min-h-[32px] items-center border-b-4 border-l-4 border-ink bg-accent-blue px-2.5 py-1 text-xs font-mono font-black uppercase tracking-widest text-white">
            {target}_PROFILE
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6 pt-8">
          {isLoading ? (
            <div className="border-4 border-ink bg-canvas p-4 font-mono text-sm font-black uppercase tracking-widest">
              Loading existing configuration
            </div>
          ) : (
            <>
              <label className="flex flex-col gap-2">
                <span className="font-mono text-xs font-black uppercase tracking-widest">Base URL</span>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(event) => {
                    setBaseUrl(event.target.value)
                    setErrors((current) => ({ ...current, baseUrl: undefined }))
                  }}
                  disabled={controlsDisabled}
                  placeholder="..."
                  className="h-14 border-4 border-ink bg-canvas px-4 font-mono text-base font-bold outline-none disabled:cursor-not-allowed disabled:border-gray-400 disabled:text-gray-400"
                />
                {errors.baseUrl && (
                  <span className="font-mono text-xs font-black uppercase tracking-widest text-accent-red">
                    {errors.baseUrl}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <span className="font-mono text-xs font-black uppercase tracking-widest">Model (Optional)</span>
                <input
                  type="text"
                  value={model}
                  onChange={(event) => {
                    setModel(event.target.value)
                    setErrors((current) => ({ ...current, model: undefined }))
                  }}
                  disabled={controlsDisabled}
                  placeholder="..."
                  className="h-14 border-4 border-ink bg-canvas px-4 font-mono text-base font-bold outline-none disabled:cursor-not-allowed disabled:border-gray-400 disabled:text-gray-400"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="font-mono text-xs font-black uppercase tracking-widest">API Key</span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => {
                    setApiKey(event.target.value)
                    setErrors((current) => ({ ...current, apiKey: undefined }))
                  }}
                  disabled={controlsDisabled}
                  autoComplete="off"
                  placeholder="..."
                  className="h-14 border-4 border-ink bg-canvas px-4 font-mono text-base font-bold outline-none disabled:cursor-not-allowed disabled:border-gray-400 disabled:text-gray-400"
                />
                {errors.apiKey && (
                  <span className="font-mono text-xs font-black uppercase tracking-widest text-accent-red">
                    {errors.apiKey}
                  </span>
                )}
              </label>

              {configError && (
                <div
                  className="border-4 border-ink bg-accent-red p-4 font-mono text-sm font-black uppercase tracking-widest text-white"
                >
                  {configError}
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                {configError ? (
                  <div className={hoverHitboxClasses}>
                    <button
                      type="button"
                      onClick={onDismissError}
                      className={`min-w-[180px] border-4 border-ink bg-accent-lime px-10 py-4 mb-12 text-lg font-black uppercase tracking-widest shadow-brutal ${buttonInteractiveClasses}`}
                    >
                      Okay
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={hoverHitboxClasses}>
                      <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className={`min-w-[180px] border-4 border-ink px-10 py-4 text-lg font-black uppercase tracking-widest ${
                          isSaving
                            ? 'cursor-not-allowed border-gray-400 bg-gray-200 text-gray-400'
                            : `bg-white shadow-brutal ${buttonInteractiveClasses}`
                        }`}
                      >
                        Cancel
                      </button>
                    </div>

                    <div className={hoverHitboxClasses}>
                      <button
                        type="submit"
                        disabled={controlsDisabled}
                        className={`min-w-[180px] border-4 border-ink px-10 py-4 text-lg font-black uppercase tracking-widest ${
                          controlsDisabled
                            ? 'cursor-not-allowed border-gray-400 bg-gray-200 text-gray-400'
                            : `bg-accent-lime shadow-brutal ${buttonInteractiveClasses}`
                        }`}
                      >
                        {isSaving ? 'Saving' : 'Save'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
