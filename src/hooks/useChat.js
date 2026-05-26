import { useState, useCallback } from 'react'
import { useStorage } from './useStorage'
import { callClaude, HAIKU } from '../lib/anthropic'

const HISTORY_WINDOW = 30

export function useChat() {
  const { get, set } = useStorage()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const callAPI = useCallback(async (fullHistory) => {
    const teacher = get('user:teacher')
    if (!teacher) throw new Error('講師情報が見つかりません')
    const windowed = fullHistory.slice(-HISTORY_WINDOW)
    return callClaude({ system: teacher.systemPrompt, messages: windowed, model: HAIKU })
  }, [get])

  const sendMessage = useCallback(async (content) => {
    const history = get('user:history') || []
    const newHistory = [...history, { role: 'user', content }]
    set('user:history', newHistory)

    setIsLoading(true)
    setError(null)

    try {
      const text = await callAPI(newHistory)
      const finalHistory = [...newHistory, { role: 'assistant', content: text }]
      set('user:history', finalHistory)
      return finalHistory
    } catch (err) {
      setError({ type: 'api', message: err.message })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [get, set, callAPI])

  const retry = useCallback(async () => {
    const history = get('user:history') || []
    if (history.length === 0 || history[history.length - 1].role !== 'user') return null

    setIsLoading(true)
    setError(null)

    try {
      const text = await callAPI(history)
      const finalHistory = [...history, { role: 'assistant', content: text }]
      set('user:history', finalHistory)
      return finalHistory
    } catch (err) {
      setError({ type: 'api', message: err.message })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [get, set, callAPI])

  return { sendMessage, retry, isLoading, error, setError }
}
