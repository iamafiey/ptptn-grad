import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'

/** Only one appears at a time. Caption label, body-strong action, trailing arrow button. */
export function NextStepCard({ label, action, detail, onClick, actionLabel }: { label: string; action: string; detail?: string; onClick?: () => void; actionLabel: string }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="t-label text-ink-2">{label}</p>
        <p className="mt-1 t-body-strong text-ink">{action}</p>
        {detail && <p className="mt-0.5 t-caption text-ink-2">{detail}</p>}
      </div>
      <button onClick={onClick} aria-label={actionLabel} className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-ink text-on-ink transition-transform active:scale-95">
        <ArrowRight size={20} strokeWidth={1.5} />
      </button>
    </Card>
  )
}
