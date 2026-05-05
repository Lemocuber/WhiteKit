import { useState } from 'react'

import { ProcessingView } from '@/app/components/ProcessingView'
import { Sidebar } from '@/app/components/Sidebar'
import { ToolGrid } from '@/app/components/ToolGrid'
import { useToolProcessManager } from '@/app/hooks/useToolProcessManager'
import { getFilteredTools, type ToolFilter } from '@/lib/tools'

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
  const filteredTools = getFilteredTools(tools, activeFilter)

  return (
    <main className="h-screen bg-canvas text-ink font-sans flex border-ink overflow-hidden select-none">
      <section className="w-[80%] min-h-0 p-8 flex flex-col overflow-hidden border-r-4 border-ink relative">
        {isProcessViewOpen && processType ? (
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
        dots={dots}
        installText={installText}
        isProcessViewOpen={isProcessViewOpen}
        isRunningProcess={isRunningProcess}
        processType={processType}
        removeText={removeText}
        startProcess={startProcess}
      />
    </main>
  )
}

export default App
