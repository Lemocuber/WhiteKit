type RoadmapCardProps = {
  label: string
  title: string
  detail: string
}

export function RoadmapCard({ label, title, detail }: RoadmapCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-white/78 p-5 shadow-[0_18px_60px_rgba(38,33,29,0.08)] backdrop-blur">
      <p className="font-[var(--font-ui)] text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-accent)]">
        {label}
      </p>
      <h2 className="mt-3 font-[var(--font-ui)] text-lg font-semibold text-[var(--color-ink)]">
        {title}
      </h2>
      <p className="mt-2 font-[var(--font-ui)] text-sm leading-6 text-[var(--color-muted)]">
        {detail}
      </p>
    </article>
  )
}
