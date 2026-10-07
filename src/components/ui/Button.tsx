import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'tertiary'
type Size = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  loading?: boolean
  block?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none transition-[transform,background-color,opacity] duration-200 ease-app active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-on-ink rounded-full',
  secondary: 'bg-surface text-ink border border-hairline rounded-full shadow-1',
  tertiary: 'text-ink rounded-full hover:opacity-70',
}

const sizes: Record<Variant, Record<Size, string>> = {
  primary: { md: 'h-12 px-6 t-body-strong', sm: 'h-9 px-4 t-caption' },
  secondary: { md: 'h-12 px-6 t-body-strong', sm: 'h-9 px-4 t-caption' },
  tertiary: { md: 'h-10 px-1 t-body-strong', sm: 'h-8 px-1 t-caption' },
}

/** Primary: ink pill (max one per screen). Secondary: white pill + hairline. Tertiary: text with arrow. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, loading, block, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[variant][size], block && 'w-full', className)}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" /> : icon}
      {children}
      {variant === 'tertiary' && <ArrowRight size={size === 'sm' ? 16 : 18} strokeWidth={1.5} aria-hidden />}
    </button>
  )
})

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  tone?: 'plain' | 'ink' | 'surface'
  size?: number
}

/** Round icon-only button. `label` is required for screen readers. */
export function IconButton({ label, tone = 'plain', size = 40, className, children, ...rest }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={cn(
        'inline-grid place-items-center rounded-full transition-[transform,opacity] duration-200 ease-app active:scale-95',
        tone === 'ink' && 'bg-ink text-on-ink',
        tone === 'surface' && 'bg-surface border border-hairline shadow-1 text-ink',
        tone === 'plain' && 'text-ink hover:bg-surface-muted',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
