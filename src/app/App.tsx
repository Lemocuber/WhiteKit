import { useState } from 'react'

import { ConfigView } from '@/app/components/ConfigView'
import { ProcessingView } from '@/app/components/ProcessingView'
import { Sidebar } from '@/app/components/Sidebar'
import { ToolGrid } from '@/app/components/ToolGrid'
import { useToolConfigManager } from '@/app/hooks/useToolConfigManager'
import { useToolProcessManager } from '@/app/hooks/useToolProcessManager'
import { getFilteredTools, type ToolFilter } from '@/lib/tools'
import type { ToolConfigTarget } from '@/lib/toolConfig'

function App() {
  const [activeFilter, setActiveFilter] = useState<ToolFilter>('all')
  const {
    tools,
    isProcessViewOpen,
    isRunningProcess,
    isProcessComplete,
    processType,
    taskQueue,
    pendingTasks,
    completedTasks,
    failedTasks,
    dots,
    canInstall,
    canUninstall,
    installText,
    removeText,
    handleToolToggle,
    startProcess,
    dismissProcessView,
  } = useToolProcessManager()
  const {
    isConfigViewOpen,
    isSavingConfig,
    configTarget,
    configResult,
    startConfig,
    cancelConfig,
    saveConfig,
    dismissConfigResult,
  } = useToolConfigManager()
  const filteredTools = getFilteredTools(tools, activeFilter)
  const selectedTools = tools.filter((tool) => tool.selected)
  const selectedConfigTarget = selectedTools.length === 1 && isConfigurableTool(selectedTools[0].id)
    ? selectedTools[0].id
    : null
  const canConfigure = Boolean(selectedConfigTarget) && !isProcessViewOpen && !isConfigViewOpen

  return (
    <main className="h-screen bg-canvas text-ink font-sans flex border-ink overflow-hidden select-none">
      <section className="w-[80%] min-h-0 p-8 flex flex-col overflow-hidden border-r-4 border-ink relative">
        {isConfigViewOpen && configTarget ? (
          <ConfigView
            configResult={configResult}
            isSaving={isSavingConfig}
            onCancel={cancelConfig}
            onOkay={dismissConfigResult}
            onSave={saveConfig}
            target={configTarget}
          />
        ) : isProcessViewOpen && processType ? (
          <ProcessingView
            completedTasks={completedTasks}
            currentTaskId={pendingTasks[0] ?? null}
            failedTasks={failedTasks}
            isComplete={isProcessComplete}
            onOkay={dismissProcessView}
            processType={processType}
            taskQueue={taskQueue}
            tools={tools}
          />
        ) : (
          <ToolGrid
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onToolToggle={handleToolToggle}
            tools={filteredTools}
          />
        )}
        <div aria-hidden="true" className="pointer-events-none absolute bottom-8 left-8 right-8 border-b-4 border-ink" />
      </section>
      <Sidebar
        canInstall={canInstall}
        canUninstall={canUninstall}
        canConfigure={canConfigure}
        configureText="Configure"
        dots={dots}
        installText={installText}
        isConfigViewOpen={isConfigViewOpen}
        isSavingConfig={isSavingConfig}
        isProcessViewOpen={isProcessViewOpen}
        isRunningProcess={isRunningProcess}
        onConfigure={() => {
          if (selectedConfigTarget) startConfig(selectedConfigTarget)
        }}
        processType={processType}
        removeText={removeText}
        startProcess={startProcess}
      />
    </main>
  )
}

export default App

function isConfigurableTool(id: string): id is ToolConfigTarget {
  return id === 'codex' || id === 'claude'
}
