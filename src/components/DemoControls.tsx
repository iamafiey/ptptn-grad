import { useNavigate } from 'react-router'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { listPersonas } from '@/services/demo'
import { studentHomePath } from '@/services/students'
import { OFFICER_ROLES, useDemo, type AppRole, type PersonaId } from '@/state/DemoProvider'
import type { Lang } from '@/types/domain'

/**
 * Presenter controls shared by the student Demo sheet, the desktop margin panel and the agency header:
 * workspace (role) toggle, demo student, officer role, language, reset.
 */
export function DemoControls({ onDone, compact }: { onDone?: () => void; compact?: boolean }) {
  const { t, lt, lang, setLang } = useT()
  const { role, setRole, personaId, setPersonaId, officerRole, setOfficerRole, resetDemo } = useDemo()
  const navigate = useNavigate()

  const switchRole = (r: AppRole) => {
    setRole(r)
    navigate(r === 'agency' ? '/a/home' : studentHomePath(personaId))
    onDone?.()
  }

  const switchPersona = (p: PersonaId) => {
    setPersonaId(p)
    if (role === 'student') navigate(studentHomePath(p))
    onDone?.()
  }

  return (
    <div className={cn('space-y-5', compact && 'space-y-4')}>
      <div>
        <p className="mb-2 t-caption text-ink-2">{t('demo.workspace')}</p>
        <SegmentedControl<AppRole>
          ariaLabel={t('demo.workspace')}
          value={role}
          onChange={switchRole}
          options={[
            { value: 'student', label: t('demo.workspace.student') },
            { value: 'agency', label: t('demo.workspace.agency') },
          ]}
        />
      </div>

      <fieldset className="min-w-0">
        <legend className="mb-2 t-caption text-ink-2">{t('demo.persona')}</legend>
        <div className="space-y-2">
          {listPersonas().map((p) => {
            const on = p.id === personaId
            return (
              <button
                key={p.id}
                onClick={() => switchPersona(p.id as PersonaId)}
                aria-pressed={on}
                className={cn(
                  'flex w-full items-center gap-3 rounded-control border px-3 py-2.5 text-left transition-colors',
                  on ? 'border-ink bg-surface' : 'border-hairline bg-surface hover:bg-surface-muted',
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-circle bg-surface-muted t-caption font-semibold">{p.initials}</span>
                <span className="min-w-0">
                  <span className="block truncate t-body-strong">{p.fullName}</span>
                  <span className="block truncate t-caption font-normal text-ink-2">
                    {p.institution} · {lt(p.state)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <Select
        label={t('demo.officerRole')}
        value={officerRole}
        onChange={(e) => setOfficerRole(e.target.value as typeof officerRole)}
        options={OFFICER_ROLES.map((r) => ({ value: r, label: t(`agency.role.${r}`) }))}
      />

      <div>
        <p className="mb-2 t-caption text-ink-2">{t('settings.language')}</p>
        <SegmentedControl<Lang>
          ariaLabel={t('settings.language')}
          value={lang}
          onChange={setLang}
          options={[
            { value: 'en', label: t('settings.language.en') },
            { value: 'ms', label: t('settings.language.ms') },
          ]}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-hairline pt-4">
        <p className="t-caption font-normal text-ink-3">{t('demo.note')}</p>
        <Button
          variant="secondary"
          size="sm"
          icon={<RotateCcw size={14} strokeWidth={1.5} />}
          onClick={() => {
            resetDemo()
            onDone?.()
          }}
        >
          {t('demo.reset')}
        </Button>
      </div>
    </div>
  )
}
