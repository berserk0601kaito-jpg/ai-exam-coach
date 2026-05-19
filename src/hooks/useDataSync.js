import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useStorage } from './useStorage'

export function useDataSync(user) {
  const { get, set } = useStorage()
  const [cloudLoaded, setCloudLoaded] = useState(false)

  const loadFromCloud = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setCloudLoaded(true)
      return
    }

    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!error && data) {
      if (data.profile && Object.keys(data.profile).length > 0) set('user:profile', data.profile)
      if (data.teacher && Object.keys(data.teacher).length > 0) set('user:teacher', data.teacher)
      if (data.plan) set('user:plan', data.plan)
      if (data.trial_start) set('user:trialStart', data.trial_start)
      if (data.usage && Object.keys(data.usage).length > 0) set('user:usage', data.usage)
      if (data.history?.length) set('user:history', data.history)
      if (data.scores?.length) set('user:scores', data.scores)
      if (data.events?.length) set('user:events', data.events)
      if (data.books?.length) set('user:books', data.books)
      if (data.last_subjects && Object.keys(data.last_subjects).length > 0) set('user:lastSubjects', data.last_subjects)
      if (data.latest_plan) set('user:latestPlan', data.latest_plan)
    }

    setCloudLoaded(true)
  }, [user?.id])

  const saveToCloud = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return

    await supabase.from('user_data').upsert({
      user_id: user.id,
      profile: get('user:profile') || {},
      teacher: get('user:teacher') || {},
      plan: get('user:plan') || 'trial',
      trial_start: get('user:trialStart') || null,
      usage: get('user:usage') || {},
      history: get('user:history') || [],
      scores: get('user:scores') || [],
      events: get('user:events') || [],
      books: get('user:books') || [],
      last_subjects: get('user:lastSubjects') || {},
      latest_plan: get('user:latestPlan') || null,
    })
  }, [user?.id])

  // ログイン時にクラウドからロード
  useEffect(() => {
    loadFromCloud()
  }, [loadFromCloud])

  // 30秒ごとに自動保存
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return
    const interval = setInterval(saveToCloud, 30000)
    return () => clearInterval(interval)
  }, [user?.id, saveToCloud])

  // ページを閉じる前に保存（ベストエフォート）
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return
    const handler = () => saveToCloud()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [user?.id, saveToCloud])

  return { cloudLoaded, saveToCloud }
}
