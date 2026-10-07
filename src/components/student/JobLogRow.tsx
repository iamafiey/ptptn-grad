import { ChevronRight } from 'lucide-react'
import { Chip, type ChipTone } from '@/components/ui/Chip'
import { LogoTile } from '@/components/ui/Tiles'
import { cn } from '@/lib/cn'

export type LogRowStatus = 'done' | 'pending' | 'attention'

/** 56px rounded evidence preview with a corner status chip. */
export function EvidenceThumb({ src, status, alt }: { src?: string; status: LogRowStatus; alt: string }) {
  const dot: Record<LogRowStatus, string> = { done: 'bg-done', pending: 'bg-pending', attention: 'bg-attention' }
  return (
    <span className="relative inline-block h-14 w-14 shrink-0">
      <span className="block h-full w-full overflow-hidden rounded-input border border-hairline bg-surface-muted">
        {src && <img src={src} alt={alt} className="h-full w-full object-cover object-top" />}
      </span>
      <span className={cn('absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-surface', dot[status])} aria-hidden />
    </span>
  )
}

/** Portal tile, role and company, date, evidence thumbnail, status chip. Tap opens the detail sheet. */
export function JobLogRow({
  portalMonogram,
  role,
  company,
  date,
  evidenceSrc,
  status,
  statusLabel,
  onOpen,
}: {
  portalMonogram: string
  role: string
  company: string
  date: string
  evidenceSrc?: string
  status: LogRowStatus
  statusLabel: string
  onOpen?: () => void
}) {
  const tone: Record<LogRowStatus, ChipTone> = { done: 'done', pending: 'pending', attention: 'attention' }
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 rounded-input px-1 py-2 text-left transition-colors hover:bg-surface-muted">
      <LogoTile monogram={portalMonogram} />
      <span className="min-w-0 flex-1">
        <span className="block truncate t-body-strong text-ink">{role}</span>
        <span className="block truncate t-caption text-ink-2">
          {company} · <span className="tabular">{date}</span>
        </span>
        <Chip tone={tone[status]} size="sm" className="mt-1">
          {statusLabel}
        </Chip>
      </span>
      <EvidenceThumb src={evidenceSrc} status={status} alt="" />
      <ChevronRight size={18} strokeWidth={1.5} className="text-ink-3" aria-hidden />
    </button>
  )
}
