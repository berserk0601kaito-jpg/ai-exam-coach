import { useCallback } from 'react'

export function useStorage() {
  const get = useCallback((key) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }, [])

  const set = useCallback((key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('Storage write error:', e)
    }
  }, [])

  const remove = useCallback((key) => {
    localStorage.removeItem(key)
  }, [])

  return { get, set, remove }
}
