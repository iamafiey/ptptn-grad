import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** 36px soft-square feature icon tile (radius 10, muted surface). */
export function IconTile({ children, className, size = 36 }: { children: ReactNode; className?: string; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={cn('inline-grid shrink-0 place-items-center rounded-chip bg-surface-muted text-ink', className)}
    >
      {children}
    </span>
  )
}

/** 40px company/portal tile. Monogram fallback when there is no logo. */
export function LogoTile({ monogram, src, alt = '', size = 40 }: { monogram: string; src?: string; alt?: string; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-grid shrink-0 place-items-center overflow-hidden rounded-[12px] border border-hairline bg-surface t-caption font-semibold tracking-tight text-ink"
    >
      {src ? <img src={src} alt={alt} className="h-full w-full object-contain" /> : <span aria-hidden>{monogram}</span>}
    </span>
  )
}
