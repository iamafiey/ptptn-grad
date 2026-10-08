import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { getOfficerForRole } from '@/services/demo'
import { useDemo } from '@/state/DemoProvider'
import { AGENCY_SECTIONS, canSee, itemsFor, sectionForPath } from '../nav'
import { asset } from '@/lib/asset'

/** Frosted sidebar. Sections are filtered by the current officer role; the active section expands. */
export function Sidebar({ onNavigate, footer }: { onNavigate?: () => void; footer?: ReactNode }) {
  const { t } = useT()
  const { officerRole } = useDemo()
  const { pathname } = useLocation()
  const activeSection = sectionForPath(pathname)
  const officer = getOfficerForRole(officerRole)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-2 pb-5 pt-1">
        <img src={asset('icons/icon.svg')} alt="" className="h-8 w-8 rounded-control" />
        <span className="t-body-strong">{t('agency.name')}</span>
      </div>
      <nav aria-label={t('agency.name')} className="-mx-1 flex-1 overflow-y-auto px-1">
        <ul className="space-y-0.5">
          {AGENCY_SECTIONS.filter((s) => canSee(s, officerRole)).map((s) => {
            const on = activeSection?.id === s.id
            const Icon = s.icon
            const items = itemsFor(s, officerRole)
            return (
              <li key={s.id}>
                <NavLink
                  to={items[0]?.path ?? s.path}
                  onClick={onNavigate}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-control px-3 t-body-sm font-medium transition-colors',
                    on ? 'bg-ink text-on-ink' : 'text-ink-2 hover:bg-surface-muted hover:text-ink',
                  )}
                >
                  <Icon size={18} strokeWidth={1.5} aria-hidden />
                  {t(s.label)}
                </NavLink>
                {on && items.length > 0 && (
                  <ul className="mb-2 mt-1 space-y-0.5 border-l border-hairline pl-3 ml-5">
                    {items.map((it) => (
                      <li key={it.path}>
                        <NavLink
                          to={it.path}
                          end={it.path === s.path}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            cn('block rounded-chip px-2.5 py-1.5 t-caption transition-colors', isActive ? 'bg-surface text-ink shadow-1' : 'text-ink-2 hover:text-ink')
                          }
                        >
                          {t(it.label)}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
      {footer && <div className="mt-3 border-t border-hairline pt-3">{footer}</div>}
      <div className="mt-3 flex items-center gap-3 border-t border-hairline px-2 pt-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-circle bg-surface-muted t-caption font-semibold">{officer.initials}</span>
        <span className="min-w-0">
          <span className="block truncate t-caption text-ink">{officer.name}</span>
          <span className="block truncate t-micro text-ink-2">{t(`agency.role.${officer.role}`)}</span>
        </span>
      </div>
    </div>
  )
}
