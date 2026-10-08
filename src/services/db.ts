import { useSyncExternalStore } from 'react'
import { STUDENT_SEEDS, type StudentSeed } from '@/data/students'

// In-memory mock backend. Services read and write here; Reset demo reseeds it.
// Swapping to a real API means replacing the service functions, not the UI.

interface Db {
  students: Record<string, StudentSeed>
}

const clone = <T,>(v: T): T => structuredClone(v)
let db: Db = { students: clone(STUDENT_SEEDS) }
let version = 0
const listeners = new Set<() => void>()

function emit() {
  version++
  listeners.forEach((l) => l())
}

export function readDb(): Db {
  return db
}

/** Apply a write and notify subscribers (hooks refetch). */
export function writeDb(fn: (d: Db) => void) {
  fn(db)
  emit()
}

export function resetDb() {
  db = { students: clone(STUDENT_SEEDS) }
  emit()
}

/** Increments on every write; hooks use it to know when to refetch. */
export function useDbVersion() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => version,
  )
}
