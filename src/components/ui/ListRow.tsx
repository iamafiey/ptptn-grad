import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { IconTile } from './Tiles'

/** Tappable settings-style row: icon tile, label, description, trailing chevron or control. */
export function ListRow({ icon, label, description, trailing, onClick }: { icon: ReactNode; label: string; description?: string; trailing?: ReactNode; onClick?: () => void }) {
  const body = (
    <>
      <IconTile>{icon}</IconTile>
      <span className="min-w-0 flex-1">
        <span className="block t-body-strong text-ink">{label}</span>
        {description && <span className="block t-caption font-normal text-ink-2">{description}</span>}
      </span>
      {trailing ?? (onClick && <ChevronRight size={18} strokeWidth={1.5} className="text-ink-3" aria-hidden />)}
    </>
  )
  return onClick ? (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-control py-2.5 text-left transition-colors hover:bg-surface-muted">
      {body}
    </button>
  ) : (
    <div className="flex items-center gap-3 py-2.5">{body}</div>
  )
}
