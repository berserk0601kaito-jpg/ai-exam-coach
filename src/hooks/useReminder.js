import { useEffect } from 'react'
import { useStorage } from './useStorage'

function getDatePlusDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useReminder() {
  const { get, set } = useStorage()

  useEffect(() => {
    check()
  }, [])

  async function check() {
    const events = get('user:events') || []
    const today  = getDatePlusDays(0)
    const target = getDatePlusDays(2) // 2日後

    const upcoming = events.filter((e) => e.date === target)
    if (upcoming.length === 0) return

    // 今日すでに通知済みのイベントを除外
    const notified = get('user:notified') || {} // { eventId: '2026-05-18' }
    const pending  = upcoming.filter((e) => notified[e.id] !== today)
    if (pending.length === 0) return

    // 通知許可チェック
    if (!('Notification' in window)) return
    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    if (permission === 'granted') {
      pending.forEach((e) => {
        new Notification('📅 2日後の予定があります', {
          body: `${e.title}（${e.date}${e.time ? ' ' + e.time : ''}）`,
          icon: '/favicon.ico',
          tag: `reminder-${e.id}`,
        })
      })
    }

    // 通知済みとして記録
    const updated = { ...notified }
    pending.forEach((e) => { updated[e.id] = today })
    set('user:notified', updated)
  }
}
