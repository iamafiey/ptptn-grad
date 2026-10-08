import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { TabBar } from '@/components/student/TabBar'
import { STUDENT_TABS, type StudentTab } from '@/components/student/tabs'
import { Sheet } from '@/components/ui/Sheet'
import { DemoControls } from '@/components/DemoControls'
import { useT } from '@/i18n'
import { DesktopRail } from './DesktopRail'
import { SettingsSheet } from './SettingsSheet'
import { StudentShellContext } from './context'

function tabFromPath(pathname: string): StudentTab | null {
  const seg = pathname.split('/')[2] as StudentTab
  return STUDENT_TABS.some((t) => t.id === seg) ? seg : null
}

/**
 * Student app shell (PWA). Mobile: full-width column with floating glass tab bar.
 * Desktop ≥1024px: centred 430px column on the canvas, frosted left rail, demo controls in the margin.
 * The window scrolls, so the glass top bar always has content beneath it.
 */
export default function StudentShell({ chrome = 'tabs' }: { chrome?: 'tabs' | 'none' }) {
  const { t } = useT()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const active = tabFromPath(pathname)
  const ctx = useMemo(() => ({ openSettings: () => setSettingsOpen(true), openDemo: () => setDemoOpen(true) }), [])
  const go = (tab: StudentTab) => navigate(`/s/${tab}`)

  return (
    <StudentShellContext.Provider value={ctx}>
      <div className="min-h-dvh bg-canvas">
        {chrome === 'tabs' && <DesktopRail active={active} onSelect={go} onOpenSettings={ctx.openSettings} />}

        <div className="relative mx-auto min-h-dvh w-full max-w-app lg:border-x lg:border-hairline">
          <Outlet />
        </div>

        {chrome === 'tabs' && (
          <div className="lg:hidden">
            <TabBar active={active ?? 'home'} onSelect={go} />
          </div>
        )}

        {/* Desktop margin: presenter controls outside the phone column. */}
        <aside className="fixed right-6 top-6 hidden w-[300px] rounded-card border border-hairline bg-surface p-5 shadow-1 xl:block" aria-label={t('demo.title')}>
          <p className="mb-4 t-label text-ink-2">{t('demo.title')}</p>
          <DemoControls compact />
        </aside>
      </div>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Sheet open={demoOpen} onClose={() => setDemoOpen(false)} title={t('demo.title')} closeLabel={t('action.close')}>
        <DemoControls onDone={() => setDemoOpen(false)} />
      </Sheet>
    </StudentShellContext.Provider>
  )
}
