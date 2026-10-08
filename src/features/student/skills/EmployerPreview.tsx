import { EyeOff, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Note } from '@/components/ui/Note'
import { LevelBar } from '@/components/ui/LevelBar'
import { useT } from '@/i18n'
import type { EmployerProfile } from '@/services/profile'
import { skillById } from '@/services/taxonomy'

/** Exactly what a Talent Partner sees before contact is accepted. Built only from toEmployerView(). */
export function EmployerPreview({ profile, limit }: { profile: EmployerProfile; limit?: number }) {
  const { t, lt } = useT()
  const skills = limit ? profile.skills.slice(0, limit) : profile.skills
  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-circle bg-surface-muted text-ink-3" aria-hidden>
          <EyeOff size={20} strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <p className="t-subheading">{profile.candidateCode}</p>
          <p className="t-caption font-normal text-ink-2">{profile.programme}</p>
          <p className="t-caption font-normal text-ink-2">
            {profile.institution} · {t(profile.graduated ? 'employer.graduated' : 'employer.graduating', { year: profile.graduationYear })}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 t-caption font-normal text-ink-2">
            <MapPin size={14} strokeWidth={1.5} aria-hidden /> {profile.state}
          </p>
        </div>
      </div>
      {profile.summary && <p className="t-body text-ink">{profile.summary}</p>}
      <div>
        <p className="mb-2 t-caption text-ink-2">{t('employer.skillsShown', { count: profile.skills.length })}</p>
        <ul className="space-y-2.5">
          {skills.map((s) => (
            <li key={s.skillId} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 t-body">{lt(skillById(s.skillId)?.name ?? { en: s.skillId })}</span>
              <span className="w-[72px] shrink-0">
                <LevelBar level={s.level} label={t(`skill.level.${s.level}`)} />
                <span className="mt-1 block t-micro text-ink-2">{t(`skill.level.${s.level}`)}</span>
              </span>
            </li>
          ))}
        </ul>
        {limit && profile.skills.length > limit && <p className="mt-2 t-caption font-normal text-ink-3">{t('onb.reveal.more', { count: profile.skills.length - limit })}</p>}
      </div>
      <Note icon={<EyeOff size={14} strokeWidth={1.5} />}>{t('employer.hidden')}</Note>
    </Card>
  )
}
