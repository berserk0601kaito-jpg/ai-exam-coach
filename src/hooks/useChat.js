import { useState, useCallback } from 'react'
import { useStorage } from './useStorage'
import { useUsage } from './useUsage'
import { callClaude, HAIKU } from '../lib/anthropic'

const HISTORY_WINDOW = 30 // 直近15ターン（30メッセージ）のみ送信

export function useChat() {
  const { get, set } = useStorage()
  const { getRemainingCount, checkUsageLimit, incrementUsage } = useUsage()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const callAPI = useCallback(async (fullHistory) => {
    const teacher = get('user:teacher')
    if (!teacher) throw new Error('講師情報が見つかりません')
    const windowed = fullHistory.slice(-HISTORY_WINDOW)
    return callClaude({ system: teacher.systemPrompt, messages: windowed, model: HAIKU })
  }, [get])

  const sendMessage = useCallback(async (content) => {
    if (!checkUsageLimit()) {
      setError({ type: 'limit', message: '今日の会話上限に達しました。また明日！' })
      return null
    }

    const history = get('user:history') || []
    const newHistory = [...history, { role: 'user', content }]
    set('user:history', newHistory) // 全履歴を保存

    setIsLoading(true)
    setError(null)

    try {
      const text = await callAPI(newHistory) // 直近15ターンのみ送信
      const finalHistory = [...newHistory, { role: 'assistant', content: text }]
      set('user:history', finalHistory)
      incrementUsage()
      return finalHistory
    } catch (err) {
      setError({ type: 'api', message: err.message })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [get, set, checkUsageLimit, incrementUsage, callAPI])

  const retry = useCallback(async () => {
    const history = get('user:history') || []
    if (history.length === 0 || history[history.length - 1].role !== 'user') return null

    if (!checkUsageLimit()) {
      setError({ type: 'limit', message: '今日の会話上限に達しました。また明日！' })
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const text = await callAPI(history)
      const finalHistory = [...history, { role: 'assistant', content: text }]
      set('user:history', finalHistory)
      incrementUsage()
      return finalHistory
    } catch (err) {
      setError({ type: 'api', message: err.message })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [get, set, checkUsageLimit, incrementUsage, callAPI])

  return { sendMessage, retry, isLoading, error, setError, getRemainingCount }
}
