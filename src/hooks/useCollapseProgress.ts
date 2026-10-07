import { useEffect, useState, type RefObject } from 'react'

/** 0 → 1 as the scroll container moves through the first `distance` px (large title → compact bar). */
export function useCollapseProgress(ref: RefObject<HTMLElement | null> | null, distance = 56) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const el = ref?.current
    const target: HTMLElement | Window = el ?? window
    const read = () => {
      const y = el ? el.scrollTop : window.scrollY
      setP(Math.min(1, Math.max(0, y / distance)))
    }
    read()
    target.addEventListener('scroll', read, { passive: true })
    return () => target.removeEventListener('scroll', read)
  }, [ref, distance])
  return p
}
