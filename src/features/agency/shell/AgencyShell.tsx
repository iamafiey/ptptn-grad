import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { IconTile } from '@/components/ui/Tiles'
import { useT } from '@/i18n'
import { studentHomePath } from '@/services/students'
import { useDemo, type AppRole } from '@/state/DemoProvider'
import { canSee, sectionForPath } from '../nav'
import { AgencyHeader } from './AgencyHeader'
import { Sidebar } from './Sidebar'

function NoAccess() {
  const { t } = useT()
  return (
    <Card className="mx-auto mt-16 max-w-md text-center">
      <div className="flex justify-center">
        <IconTile>
          <Lock size={20} strokeWidth={1.5} />
        </IconTile>
      </div>
      <p className="mt-4 t-subheading">{t('agency.noAccess.title')}</p>
      <p className="mt-1 t-body-sm text-ink-2">{t('agency.noAccess.body')}</p>
    </Card>
  )
}

/** Desktop-first agency workspace: frosted sidebar, sticky header, role-scoped content. */
export default function AgencyShell() {
  const { t } = useT()
  const { officerRole, setRole, personaId } = useDemo()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [drawer, setDrawer] = useState(false)
  const section = sectionForPath(pathname)
  const allowed = !section || canSee(section, officerRole)

  return (
    <div className="min-h-dvh bg-canvas t-body-sm">
      <aside className="glass fixed inset-y-3 left-3 z-40 hidden w-[248px] rounded-card p-3 lg:block print:!hidden">
        <Sidebar />
      </aside>

      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-ink/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.aside
              className="absolute inset-y-0 left-0 w-[280px] bg-surface p-3 shadow-3"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            >
              {/* On small screens the header hides the workspace toggle, so it lives in the drawer. */}
              <Sidebar
                onNavigate={() => setDrawer(false)}
                footer={
                  <SegmentedControl<AppRole>
                    ariaLabel={t('demo.workspace')}
                    value="agency"
                    onChange={(r) => {
                      setRole(r)
                      if (r === 'student') navigate(studentHomePath(personaId))
                    }}
                    options={[
                      { value: 'student', label: t('demo.workspace.student') },
                      { value: 'agency', label: t('demo.workspace.agency') },
                    ]}
                  />
                }
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-[264px] print:!pl-0">
        <AgencyHeader onMenu={() => setDrawer(true)} />
        <main className="mx-auto max-w-[1320px] px-4 py-8 lg:px-8">{allowed ? <Outlet /> : <NoAccess />}</main>
      </div>
    </div>
  )
}
