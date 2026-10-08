import { ChevronDown } from 'lucide-react'

/** "Show N more" under a shortened list; keeps long lists to one screen until asked. */
export function ShowMore({ remaining, label, onClick }: { remaining: number; label: string; onClick: () => void }) {
  if (remaining <= 0) return null
  return (
    <button onClick={onClick} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-control border border-hairline bg-surface t-caption text-ink shadow-1 hover:bg-surface-muted">
      {label}
      <ChevronDown size={16} strokeWidth={1.5} aria-hidden />
    </button>
  )
}
