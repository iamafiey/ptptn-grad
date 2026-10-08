import { readDb, writeDb } from './db'
import { delay } from './delay'

export function listNotifications(studentId: string) {
  return delay(readDb().notifications.filter((n) => n.studentId === studentId).sort((a, b) => b.at.localeCompare(a.at)), 140)
}

export function unreadCount(studentId: string) {
  return readDb().notifications.filter((n) => n.studentId === studentId && !n.read).length
}

export async function markAllRead(studentId: string) {
  writeDb((d) => d.notifications.forEach((n) => n.studentId === studentId && (n.read = true)))
  return delay(true, 60)
}

export async function markRead(id: string) {
  writeDb((d) => {
    const n = d.notifications.find((x) => x.id === id)
    if (n) n.read = true
  })
  return delay(true, 40)
}
