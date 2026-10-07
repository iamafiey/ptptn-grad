// Preferences only (role, language, demo persona). Demo flows never depend on these.
export function readPref<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(`ptptn.${key}`)
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
  } catch {
    return fallback
  }
}

export function writePref(key: string, value: string) {
  try {
    localStorage.setItem(`ptptn.${key}`, value)
  } catch {
    /* private mode: preference just won't persist */
  }
}
