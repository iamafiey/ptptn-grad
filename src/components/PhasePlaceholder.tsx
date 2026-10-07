import { Hammer } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/Tiles'
import { useT } from '@/i18n'
import type { LocalizedText } from '@/types/domain'

/** Temporary stand-in for screens built in later phases; lists what will live here. */
export function PhasePlaceholder({ phase, items }: { phase: number; items: LocalizedText[] }) {
  const { t, lt } = useT()
  return (
    <Card className="border-dashed shadow-none">
      <div className="flex items-center gap-3">
        <IconTile>
          <Hammer size={20} strokeWidth={1.5} />
        </IconTile>
        <p className="t-body-strong">{t('placeholder.phase', { n: phase })}</p>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 t-body text-ink-2 marker:text-ink-3">
        {items.map((it, i) => (
          <li key={i}>{lt(it)}</li>
        ))}
      </ul>
    </Card>
  )
}
