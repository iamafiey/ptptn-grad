import { STUDENT_TABS, type StudentTab } from '@/components/student/tabs'
import { Avatar } from '@/components/ui/Rings'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { getPersona } from '@/services/demo'
import { useDemo } from '@/state/DemoProvider'

/** ≥1024px: frosted left rail replaces the floating tab bar. */
export function DesktopRail({ active, onSelect, onOpenSettings }: { active: StudentTab | null; onSelect: (t: StudentTab) => void; onOpenSettings: () => void }) {
  const { t } = useT()
  const { personaId } = useDemo()
  const persona = getPersona(personaId)

  return (
    <aside className="glass fixed inset-y-3 left-3 z-40 hidden w-[232px] flex-col rounded-card p-3 lg:flex">
      <div className="flex items-center gap-2.5 px-2 pb-5 pt-2">
        <img src="/icons/icon.svg" alt="" className="h-8 w-8 rounded-control" />
        <span className="t-body-strong">{t('app.name')}</span>
      </div>
      <nav aria-label={t('app.name')} className="flex-1">
        <ul className="space-y-1">
          {STUDENT_TABS.map(({ id, icon: Icon, label }) => {
            const on = id === active
            return (
              <li key={id}>
                <button
                  onClick={() => onSelect(id)}
                  aria-current={on ? 'page' : undefined}
                  className={cn(
                    'flex h-11 w-full items-center gap-3 rounded-control px-3 t-body-strong transition-colors',
                    on ? 'bg-ink text-on-ink' : 'text-ink-2 hover:bg-surface-muted hover:text-ink',
                  )}
                >
                  <Icon size={20} strokeWidth={1.5} aria-hidden />
                  {t(label)}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
      <button onClick={onOpenSettings} className="flex items-center gap-3 rounded-control p-2 text-left hover:bg-surface-muted">
        <Avatar initials={persona.initials} strength={persona.profileStrength} size={40} label={t('settings.profileStrength', { pct: persona.profileStrength })} />
        <span className="min-w-0">
          <span className="block truncate t-body-strong">{persona.fullName}</span>
          <span className="block t-caption font-normal text-ink-2">{t('settings.title')}</span>
        </span>
      </button>
    </aside>
  )
}
