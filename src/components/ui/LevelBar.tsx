import type { SkillLevel } from '@/types/domain'
import { cn } from '@/lib/cn'

const ORDER: SkillLevel[] = ['foundation', 'working', 'advanced']

/** 3-segment level bar (Foundation, Working, Advanced) filled in ink. */
export function LevelBar({ level, label, className }: { level: SkillLevel; label: string; className?: string }) {
  const filled = ORDER.indexOf(level) + 1
  return (
    <span className={cn('flex gap-1', className)} role="img" aria-label={label}>
      {ORDER.map((l, i) => (
        <span key={l} className={cn('h-1.5 flex-1 rounded-sm', i < filled ? 'bg-ink' : 'bg-hairline')} />
      ))}
    </span>
  )
}
