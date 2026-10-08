import type { ReactNode } from 'react'
import { SunriseCard } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { IconTile } from '@/components/ui/Tiles'

/** Home hero: Sunrise, state-driven headline, "Live" chip with icon tiles, one ink button. */
export function HeroCard({
  liveLabel,
  icons,
  headline,
  body,
  action,
}: {
  liveLabel: string
  icons: ReactNode[]
  headline: ReactNode
  body?: string
  action: ReactNode
}) {
  return (
    <SunriseCard className="relative overflow-hidden">
      <div className="flex items-center gap-2">
        <Chip tone="ink" size="md" icon={<span className="h-1.5 w-1.5 rounded-circle bg-done" aria-hidden />}>
          {liveLabel}
        </Chip>
        <div className="flex -space-x-1.5">
          {icons.map((icon, i) => (
            <IconTile key={i} size={28} className="border-2 border-[#FFF3CF] bg-surface">
              {icon}
            </IconTile>
          ))}
        </div>
      </div>
      <h2 className="mt-6 t-display-l text-ink">{headline}</h2>
      {body && <p className="mt-2 max-w-[30ch] t-body text-ink-2">{body}</p>}
      <div className="mt-5">{action}</div>
    </SunriseCard>
  )
}
