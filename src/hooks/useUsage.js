import { useCallback } from 'react'
import { useStorage } from './useStorage'
import { getJSTDateString } from '../lib/date'

export const PLAN_LIMITS = {
  trial: 15,
  light: 20,
  standard: 50,
}

// 面談・成績・参考書相談のAPIコールをすべてまとめてカウントする共通フック
export function useUsage() {
  const { get, set } = useStorage()

  const getUsage = useCallback(() => {
    const today = getJSTDateString()
    const stored = get('user:usage') || { date: today, count: 0 }
    return stored.date === today ? stored : { date: today, count: 0 }
  }, [get])

  const getRemainingCount = useCallback(() => {
    const plan = get('user:plan') || 'trial'
    return PLAN_LIMITS[plan] - getUsage().count
  }, [get, getUsage])

  const checkUsageLimit = useCallback(() => {
    return getRemainingCount() > 0
  }, [getRemainingCount])

  const incrementUsage = useCallback(() => {
    const usage = getUsage()
    set('user:usage', { date: usage.date, count: usage.count + 1 })
  }, [getUsage, set])

  return { getRemainingCount, checkUsageLimit, incrementUsage }
}
