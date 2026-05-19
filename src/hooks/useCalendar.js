import { useStorage } from './useStorage'

export const CATEGORIES = ['模試', '部活', '学校行事', '勉強', 'その他']

export const CATEGORY_STYLE = {
  '模試':     { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700 border-red-200' },
  '部活':     { dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  '学校行事': { dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  '勉強':     { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700 border-green-200' },
  'その他':   { dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600 border-gray-200' },
}

export function useCalendar() {
  const { get, set } = useStorage()

  const getAll = () => get('user:events') || []

  const add = (event) => {
    const all = getAll()
    const newEvent = { id: Date.now(), ...event }
    set('user:events', [...all, newEvent].sort((a, b) => a.date.localeCompare(b.date)))
    return newEvent
  }

  const remove = (id) => {
    set('user:events', getAll().filter((e) => e.id !== id))
  }

  const getByDate = (dateStr) => getAll().filter((e) => e.date === dateStr)

  const getUpcoming = (limit = 10) => {
    const today = new Date().toISOString().split('T')[0]
    return getAll().filter((e) => e.date >= today).slice(0, limit)
  }

  return { getAll, add, remove, getByDate, getUpcoming }
}
