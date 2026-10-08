import { useNavigate } from 'react-router'
import { BadgeCheck, Bell, BriefcaseBusiness, CalendarClock, FileCheck2, Gift, Sparkles, TrendingUp, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconTile } from '@/components/ui/Tiles'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { listNotifications, markAllRead, markRead } from '@/services/notifications'
import type { AppNotification } from '@/types/domain'
import { StudentPage } from '../shell/StudentPage'
import { useStudent } from '../useStudent'

const ICONS: Record<AppNotification['type'], React.ReactNode> = {
  invitation: <BriefcaseBusiness size={20} strokeWidth={1.5} />,
  invitationExpiring: <CalendarClock size={20} strokeWidth={1.5} />,
  interview: <CalendarClock size={20} strokeWidth={1.5} />,
  newMatches: <Sparkles size={20} strokeWidth={1.5} />,
  rescored: <TrendingUp size={20} strokeWidth={1.5} />,
  paymentDue: <Wallet size={20} strokeWidth={1.5} />,
  benefits: <Gift size={20} strokeWidth={1.5} />,
  evidence: <FileCheck2 size={20} strokeWidth={1.5} />,
  threshold: <BadgeCheck size={20} strokeWidth={1.5} />,
}

/** In-app copy of every notification channel (push, SMS, email, digest). */
export default function NotificationsPage() {
  const { t, lt, lang } = useT()
  const navigate = useNavigate()
  const { id } = useStudent()
  const { data } = useAsync(() => listNotifications(id), [id])
  const unread = data?.filter((n) => !n.read).length ?? 0

  return (
    <StudentPage title={t('student.notifications.title')}>
      {unread > 0 && (
        <div className="flex items-center justify-between">
          <p className="t-caption text-ink-2">{t('notif.unread', { count: unread })}</p>
          <Button variant="secondary" size="sm" onClick={() => markAllRead(id)}>
            {t('notif.markAll')}
          </Button>
        </div>
      )}
      {data && data.length === 0 ? (
        <Card>
          <EmptyState title={t('notif.empty')} />
        </Card>
      ) : (
        <Card padded={false} className="divide-y divide-hairline">
          {(data ?? []).map((n) => (
            <button
              key={n.id}
              onClick={async () => {
                await markRead(n.id)
                if (n.link) navigate(n.link)
              }}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-muted"
            >
              <IconTile>{ICONS[n.type] ?? <Bell size={20} strokeWidth={1.5} />}</IconTile>
              <span className="min-w-0 flex-1">
                <span className={cn('block t-body', !n.read && 'font-medium')}>{lt(n.body)}</span>
                <span className="block t-caption font-normal text-ink-3">{formatDate(n.at, lang, 'weekday')}</span>
              </span>
              {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-circle bg-attention-ink" aria-label={t('notif.unread', { count: 1 })} />}
            </button>
          ))}
        </Card>
      )}
    </StudentPage>
  )
}
