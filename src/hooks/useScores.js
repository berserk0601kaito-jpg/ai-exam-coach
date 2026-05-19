import { useStorage } from './useStorage'

export function useScores() {
  const { get, set } = useStorage()

  const getAll = () => get('user:scores') || []

  const add = (entry) => {
    const all = getAll()
    const newEntry = { id: Date.now(), ...entry }
    set('user:scores', [newEntry, ...all])
    return newEntry
  }

  const remove = (id) => {
    set('user:scores', getAll().filter((s) => s.id !== id))
  }

  const updateAnalysis = (id, analysis) => {
    set('user:scores', getAll().map((s) => (s.id === id ? { ...s, aiAnalysis: analysis } : s)))
  }

  return { getAll, add, remove, updateAnalysis }
}
