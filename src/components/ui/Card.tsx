import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLElement> {
  padded?: boolean
  as?: 'div' | 'section' | 'article'
}

/** Solid content card: hairline border + shadow-1, radius 20. Never glass, never nested card-in-card-in-card. */
export function Card({ padded = true, as: Tag = 'div', className, ...rest }: CardProps) {
  return <Tag className={cn('rounded-card border border-hairline bg-surface shadow-1', padded && 'p-4', className)} {...rest} />
}

/** The one Sunrise surface per screen (Home hero, skills reveal, Tier A celebration, agency pulse). */
export function SunriseCard({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('on-sunrise rounded-hero bg-sunrise p-5 shadow-2', className)} {...rest} />
}
