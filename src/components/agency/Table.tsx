import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/** Dense agency table: muted header, hairline rows, horizontal scroll inside its card on small screens. */
export function Table({ children, minWidth = 720, className }: { children: ReactNode; minWidth?: number; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full t-body-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-surface-muted text-left">
      <tr className="t-label text-ink-2">{children}</tr>
    </thead>
  )
}

export function Th({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-2.5 font-medium whitespace-nowrap', className)} {...rest} />
}

export function Tr({ className, active, onClick, ...rest }: HTMLAttributes<HTMLTableRowElement> & { active?: boolean }) {
  return (
    <tr
      className={cn('border-t border-hairline', onClick && 'cursor-pointer hover:bg-surface-muted', active && 'bg-surface-muted', className)}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick(e as never)) : undefined}
      {...rest}
    />
  )
}

export function Td({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle', className)} {...rest} />
}
