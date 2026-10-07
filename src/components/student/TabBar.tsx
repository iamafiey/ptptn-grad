import { motion } from 'motion/react'
import { useT } from '@/i18n'
import { STUDENT_TABS, type StudentTab } from './tabs'
import { cn } from '@/lib/cn'


/**
 * Floating glass pill, inset 12px from the edges and 12px above the safe area.
 * Active tab: ink pill behind icon + label. Inactive: icon + small label in ink-2.
 */
export function TabBar({ active, onSelect, position = 'fixed' }: { active: StudentTab; onSelect: (t: StudentTab) => void; position?: 'fixed' | 'absolute' }) {
  const { t } = useT()
  return (
    <nav
      aria-label={t('app.name')}
      className={cn(position, 'inset-x-3 bottom-[calc(12px+var(--safe-bottom))] z-40 mx-auto max-w-[406px]')}
    >
      <ul className="glass flex items-stretch gap-0.5 rounded-hero p-1.5">
        {STUDENT_TABS.map(({ id, icon: Icon, label }) => {
          const on = id === active
          return (
            <li key={id} className="min-w-0 flex-auto">
              <button
                onClick={() => onSelect(id)}
                aria-current={on ? 'page' : undefined}
                className={cn('relative flex h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-[22px] px-2 transition-colors', on ? 'text-on-ink' : 'text-ink-2 hover:text-ink')}
              >
                {on && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-[22px] bg-ink" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}
                <Icon size={20} strokeWidth={1.5} className="relative" aria-hidden />
                <span className="relative whitespace-nowrap text-center t-micro">{t(label)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
