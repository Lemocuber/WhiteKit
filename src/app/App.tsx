import { RoadmapCard } from '@/components/roadmap-card'
import { milestones } from '@/lib/milestones'

function App() {
  return (
    <main className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(193,106,63,0.18),_transparent_28%),radial-gradient(circle_at_85%_20%,_rgba(24,69,59,0.2),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.35),_transparent_35%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(38,33,29,0.24),transparent)]" />

        <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
          <header className="flex items-center justify-between border-b border-[var(--color-line)] pb-5">
            <div>
              <p className="font-[var(--font-ui)] text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">
                WhiteKit
              </p>
            </div>
            <p className="hidden font-[var(--font-ui)] text-sm text-[var(--color-muted)] sm:block">
              Frontend foundation
            </p>
          </header>

          <div className="flex flex-1 items-center py-14 sm:py-20">
            <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
              <div className="max-w-3xl">
                <p className="mb-6 font-[var(--font-ui)] text-sm uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Dev environment maintenance, minus the yak shaving
                </p>
                <h1 className="max-w-4xl font-[var(--font-display)] text-5xl leading-none tracking-[-0.045em] text-[var(--color-ink)] sm:text-6xl lg:text-7xl">
                  A desktop control surface for keeping local tooling sane.
                </h1>
                <p className="mt-6 max-w-2xl font-[var(--font-ui)] text-base leading-7 text-[var(--color-muted)] sm:text-lg">
                  This workspace starts as a pure frontend so the interaction model can be designed
                  before the native layer exists. Real Tauri backend work comes later in{' '}
                  <code className="rounded-full border border-[var(--color-line)] bg-white/70 px-3 py-1 text-[0.92em] text-[var(--color-ink)] shadow-[0_8px_20px_rgba(38,33,29,0.05)]">
                    src-tauri/
                  </code>
                  .
                </p>
              </div>

              <aside className="grid gap-4">
                {milestones.map((milestone) => (
                  <RoadmapCard key={milestone.label} {...milestone} />
                ))}
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
