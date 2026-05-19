import { useStorage } from './useStorage'

export const PROGRESS_STATES = ['未着手', '進行中', '完了']

export function useBooks() {
  const { get, set } = useStorage()

  const getAll = () => get('user:books') || []

  const add = (book) => {
    const all = getAll()
    const newBook = { id: Date.now(), progress: '未着手', addedAt: new Date().toISOString().split('T')[0], ...book }
    set('user:books', [newBook, ...all])
    return newBook
  }

  const remove = (id) => {
    set('user:books', getAll().filter((b) => b.id !== id))
  }

  const update = (id, changes) => {
    set('user:books', getAll().map((b) => (b.id === id ? { ...b, ...changes } : b)))
  }

  return { getAll, add, remove, update }
}
