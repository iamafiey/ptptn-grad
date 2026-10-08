import { readDb } from './db'
import { delay } from './delay'

export function getPlacements() {
  return delay(readDb().placements, 140)
}
