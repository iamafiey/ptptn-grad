import { useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

interface Option<T extends string> {
  value: T
  label: string
}

/** In-screen tabs: muted track, selected segment white + shadow-1. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  className?: string
  ariaLabel: string
}) {
  const id = useId()
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex rounded-control bg-surface-muted p-1 border border-hairline', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn('relative h-9 flex-1 rounded-chip px-3 t-caption transition-colors', active ? 'text-ink' : 'text-ink-2')}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-chip bg-surface shadow-1"
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              />
            )}
            <span className="relative truncate">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
