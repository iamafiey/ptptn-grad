import { useNavigate } from 'react-router'
import { Bell, Menu, Search } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { useT } from '@/i18n'
import { getPersona } from '@/services/demo'
import { OFFICER_ROLES, useDemo, type AppRole } from '@/state/DemoProvider'

/** Role badge + picker, global search, notifications, BM/EN, and the Student | Agency toggle. */
export function AgencyHeader({ onMenu }: { onMenu: () => void }) {
  const { t, lang, setLang } = useT()
  const { setRole, personaId, officerRole, setOfficerRole } = useDemo()
  const navigate = useNavigate()

  const switchRole = (r: AppRole) => {
    setRole(r)
    if (r === 'student') navigate(getPersona(personaId).homePath)
  }

  return (
    <header className="glass sticky top-0 z-30 !rounded-none !border-x-0 !border-t-0 !shadow-none">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
        <IconButton label={t('agency.name')} className="lg:hidden" onClick={onMenu}>
          <Menu size={20} strokeWidth={1.5} />
        </IconButton>

        <label className="relative hidden max-w-md flex-1 md:block">
          <span className="sr-only">{t('agency.search')}</span>
          <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
          <input
            type="search"
            placeholder={t('agency.search')}
            className="h-10 w-full rounded-control border border-hairline bg-surface pl-9 pr-3 t-body-sm text-ink placeholder:text-ink-3 focus:outline-[1.5px] focus:outline-ink focus:outline-offset-2"
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          {officerRole === 'leadershipViewer' && <Chip tone="info" size="sm">{t('agency.readOnly')}</Chip>}
          <Select
            label={t('demo.officerRole')}
            hideLabel
            size="sm"
            className="w-48"
            value={officerRole}
            onChange={(e) => setOfficerRole(e.target.value as typeof officerRole)}
            options={OFFICER_ROLES.map((r) => ({ value: r, label: t(`agency.role.${r}`) }))}
          />
          <SegmentedControl<AppRole>
            ariaLabel={t('demo.workspace')}
            className="hidden w-44 sm:flex"
            value="agency"
            onChange={switchRole}
            options={[
              { value: 'student', label: t('demo.workspace.student') },
              { value: 'agency', label: t('demo.workspace.agency') },
            ]}
          />
          <Button variant="secondary" size="sm" onClick={() => setLang(lang === 'en' ? 'ms' : 'en')} aria-label={t('settings.language')}>
            {lang === 'en' ? 'BM' : 'EN'}
          </Button>
          <IconButton label={t('nav.notifications')} tone="surface" size={36}>
            <Bell size={18} strokeWidth={1.5} />
          </IconButton>
        </div>
      </div>
    </header>
  )
}
