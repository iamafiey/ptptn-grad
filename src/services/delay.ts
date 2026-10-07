// Simulated network latency so loading states are real. `?fast=1` shortens it for rehearsals.
const fast = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fast')

export function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), fast ? Math.min(ms, 60) : ms))
}
