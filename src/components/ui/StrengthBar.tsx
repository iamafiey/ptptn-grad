import { motion, useReducedMotion } from 'motion/react'
import { AnimatedNumber } from './AnimatedNumber'

/** Thin profile-strength meter with a ticking percentage. */
export function StrengthBar({ pct, label }: { pct: number; label: string }) {
  const reduce = useReducedMotion()
  return (
    <div>
      <div className="flex items-center justify-between t-caption">
        <span className="text-ink-2">{label}</span>
        <span className="tabular text-ink">
          <AnimatedNumber value={pct} />%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-sm bg-hairline" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
        <motion.div className="h-full bg-ink" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: reduce ? 0 : 0.4, ease: [0.2, 0.8, 0.2, 1] }} />
      </div>
    </div>
  )
}
