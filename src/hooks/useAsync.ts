import { useEffect, useState } from 'react'
import { useDbVersion } from '@/services/db'

/**
 * Runs an async service call and re-runs it when deps or the mock DB change.
 * Keeps the previous data while refetching (no flicker after writes).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): { data: T | undefined; loading: boolean; error: unknown } {
  const v = useDbVersion()
  const [state, setState] = useState<{ data: T | undefined; loading: boolean; error: unknown }>({ data: undefined, loading: true, error: null })

  useEffect(() => {
    let alive = true
    fn().then(
      (data) => alive && setState({ data, loading: false, error: null }),
      (error) => alive && setState((s) => ({ ...s, loading: false, error })),
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, v])

  return state
}
