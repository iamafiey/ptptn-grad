import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { useT } from '@/i18n'
import { addMissingSkill } from '@/services/students'
import { listCategories, listSkills } from '@/services/taxonomy'

/** Pick a taxonomy skill to add. It starts at Foundation with low confidence until evidenced. */
export function AddSkillSheet({ studentId, existing, open, onClose }: { studentId: string; existing: string[]; open: boolean; onClose: () => void }) {
  const { t, lt } = useT()
  const [q, setQ] = useState('')
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return listCategories()
      .map((c) => ({
        c,
        skills: listSkills().filter((s) => s.categoryId === c.id && (!needle || lt(s.name).toLowerCase().includes(needle) || s.name.en.toLowerCase().includes(needle))),
      }))
      .filter((g) => g.skills.length)
  }, [q, lt])

  return (
    <Sheet open={open} onClose={onClose} title={t('onb.review.addMissing')} closeLabel={t('action.close')}>
      <p className="t-caption font-normal text-ink-2">{t('onb.review.addMissingHint')}</p>
      <label className="relative mt-4 block">
        <span className="sr-only">{t('skill.search')}</span>
        <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('skill.search')}
          className="h-12 w-full rounded-control bg-surface-muted pl-9 pr-3 t-body placeholder:text-ink-3 focus:outline focus:outline-[1.5px] focus:outline-ink focus:outline-offset-2"
        />
      </label>
      <div className="mt-4 space-y-5">
        {groups.map(({ c, skills }) => (
          <section key={c.id}>
            <p className="mb-1 t-label text-ink-2">{lt(c.name)}</p>
            <ul className="divide-y divide-hairline">
              {skills.map((s) => {
                const has = existing.includes(s.id)
                return (
                  <li key={s.id}>
                    <button
                      disabled={has}
                      onClick={async () => {
                        await addMissingSkill(studentId, s.id)
                        onClose()
                      }}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left disabled:opacity-50"
                    >
                      <span>
                        <span className="block t-body">{lt(s.name)}</span>
                        {has && <span className="block t-caption font-normal text-ink-3">{t('skill.alreadyAdded')}</span>}
                      </span>
                      {!has && <Plus size={18} strokeWidth={1.5} className="text-ink-2" aria-hidden />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  )
}
