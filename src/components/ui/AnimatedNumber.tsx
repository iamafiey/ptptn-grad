import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { formatNumber } from '@/lib/format'

/** Ticks up to `value` over 400ms (spec §Motion). Reduced motion: jumps straight to the value. */
export function AnimatedNumber({ value, format = formatNumber, from }: { value: number; format?: (n: number) => string; from?: number }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(from ?? value)
  const prev = useRef(from ?? value)

  useEffect(() => {
    if (reduce) {
      prev.current = value
      return
    }
    const controls = animate(prev.current, value, {
      duration: 0.4,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, reduce])

  return <span className="tabular">{format(reduce ? value : shown)}</span>
}
