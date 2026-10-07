import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { AnimatedNumber } from './AnimatedNumber'

interface RingProps {
  value: number // 0..100
  size: number
  stroke: number
  children?: ReactNode
  label?: string
}

/** Base progress ring: ink arc on a hairline track. */
export function ProgressRing({ value, size, stroke, children, label }: RingProps) {
  const reduce = useReducedMotion()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(100, Math.max(0, value)) / 100)
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hairline)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduce ? 0 : 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  )
}

/** Small match % ring used on role cards. */
export function MatchRing({ pct, label }: { pct: number; label: string }) {
  return (
    <ProgressRing value={pct} size={44} stroke={3} label={label}>
      <span className="t-micro font-semibold text-ink">
        <AnimatedNumber value={pct} />
        <span className="text-ink-2">%</span>
      </span>
    </ProgressRing>
  )
}

/** Avatar with profile-strength ring (thin in the top bar, fuller on Profile). */
export function Avatar({ initials, strength, size = 36, label }: { initials: string; strength?: number; size?: number; label?: string }) {
  const inner = (
    <span
      className="inline-grid place-items-center rounded-circle bg-surface-muted font-semibold text-ink"
      style={{ width: size - (strength !== undefined ? 8 : 0), height: size - (strength !== undefined ? 8 : 0), fontSize: size * 0.32 }}
    >
      {initials}
    </span>
  )
  if (strength === undefined) return inner
  return (
    <ProgressRing value={strength} size={size} stroke={size > 60 ? 4 : 2} label={label}>
      {inner}
    </ProgressRing>
  )
}
