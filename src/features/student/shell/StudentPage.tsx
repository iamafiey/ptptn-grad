import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Bell } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Rings'
import { LargeTitle, TopAppBar } from '@/components/student/TopAppBar'
import { useCollapseProgress } from '@/hooks/useCollapseProgress'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { getPersona } from '@/services/demo'
import { useDemo } from '@/state/DemoProvider'
import { useStudentShell } from './context'

/**
 * Standard student screen: collapsing top bar (avatar → Settings, Demo, bell), large title,
 * content padded for the floating tab bar. `wash` adds the faint Sunrise wash (Home only).
 */
export function StudentPage({ title, heading, eyebrow, wash, children }: { title: string; heading?: ReactNode; eyebrow?: ReactNode; wash?: boolean; children: ReactNode }) {
  const { t } = useT()
  const navigate = useNavigate()
  const { personaId } = useDemo()
  const { openSettings, openDemo } = useStudentShell()
  const progress = useCollapseProgress(null)
  const persona = getPersona(personaId)

  return (
    <div className={cn('relative pb-32 lg:pb-16')}>
      {wash && <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-sunrise-wash" aria-hidden />}
      <TopAppBar
        title={title}
        progress={progress}
        leading={
          <button onClick={openSettings} aria-label={t('student.openSettings')} className="rounded-circle">
            <Avatar initials={persona.initials} strength={persona.profileStrength} size={36} label={t('settings.profileStrength', { pct: persona.profileStrength })} />
          </button>
        }
        trailing={
          <>
            <button onClick={openDemo} className="h-8 rounded-control border border-hairline bg-surface px-2.5 t-caption text-ink-2 shadow-1 hover:text-ink xl:hidden">
              {t('demo.button')}
            </button>
            <IconButton label={t('nav.notifications')} onClick={() => navigate('/s/notifications')}>
              <Bell size={20} strokeWidth={1.5} />
            </IconButton>
          </>
        }
      />
      <div className="relative">
        <LargeTitle progress={progress} eyebrow={eyebrow}>
          {heading ?? title}
        </LargeTitle>
        <div className="space-y-6 px-5">{children}</div>
      </div>
    </div>
  )
}
