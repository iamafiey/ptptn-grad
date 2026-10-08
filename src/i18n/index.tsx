import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en, type I18nKey } from './en'
import { ms } from './ms'
import { readPref, writePref } from '@/lib/storage'
import type { Lang, LocalizedText } from '@/types/domain'

type Vars = Record<string, string | number>
type PluralBase<K> = K extends `${infer B}_one` ? B : never
export type TKey = I18nKey | PluralBase<I18nKey>

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TKey, vars?: Vars) => string
  /** Pick the right language from data content. */
  lt: (text: LocalizedText) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function lookup(lang: Lang, key: string): string | undefined {
  const k = key as I18nKey
  return (lang === 'ms' ? ms[k] : undefined) ?? en[k]
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readPref('lang', ['en', 'ms'] as const, 'en'))

  useEffect(() => {
    document.documentElement.lang = lang === 'ms' ? 'ms' : 'en'
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    writePref('lang', l)
  }, [])

  const t = useCallback(
    (key: TKey, vars?: Vars) => {
      let s: string | undefined
      if (vars && typeof vars.count === 'number') {
        s = lookup(lang, `${key}_${vars.count === 1 ? 'one' : 'other'}`)
      }
      s ??= lookup(lang, key) ?? key
      return vars ? s.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : s
    },
    [lang],
  )

  const lt = useCallback((text: LocalizedText) => (lang === 'ms' && text.ms ? text.ms : text.en), [lang])

  const value = useMemo(() => ({ lang, setLang, t, lt }), [lang, setLang, t, lt])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useT() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useT must be used inside I18nProvider')
  return ctx
}
