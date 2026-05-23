import { useState, useEffect } from 'react'
import { useStorage } from './hooks/useStorage'
import { useAuth } from './hooks/useAuth'
import { useDataSync } from './hooks/useDataSync'
import { isSupabaseConfigured } from './lib/supabase'
import SurveyPage from './pages/SurveyPage'
import ChatPage from './pages/ChatPage'
import SettingsPage from './pages/SettingsPage'
import PlanSelectPage from './pages/PlanSelectPage'
import AuthPage from './pages/AuthPage'
import { isTrialUsedOnDevice } from './lib/deviceId'
import { getJSTDateString } from './lib/date'

const TRIAL_DAYS = 3

function isTrialExpired(trialStart) {
  if (!trialStart) return false
  const today = getJSTDateString()
  return Math.floor((new Date(today) - new Date(trialStart)) / 86400000) >= TRIAL_DAYS
}

export default function App() {
  const { get } = useStorage()
  const { user, loading: authLoading } = useAuth()
  const { cloudLoaded, saveToCloud } = useDataSync(user)
  const [screen, setScreen] = useState('loading') // loading | auth | survey | chat | settings | plan | plan-device

  useEffect(() => {
    // 認証チェック中 or クラウドデータロード中は待つ
    if (isSupabaseConfigured() && (authLoading || !cloudLoaded)) return

    // 未ログインならauth画面へ
    if (isSupabaseConfigured() && !user) {
      setScreen('auth')
      return
    }

    const profile = get('user:profile')
    const teacher = get('user:teacher')

    if (!profile || !teacher) {
      if (isTrialUsedOnDevice()) {
        setScreen('plan-device')
      } else {
        setScreen('survey')
      }
      return
    }

    const plan = get('user:plan') || 'trial'
    const trialStart = get('user:trialStart')

    if (plan === 'trial' && isTrialExpired(trialStart)) {
      setScreen('plan')
      return
    }

    setScreen('chat')
  }, [authLoading, user, cloudLoaded])

  const handleSurveyComplete = ({ profile, teacher }) => {
    setScreen('chat')
    setTimeout(saveToCloud, 500)
  }

  if (screen === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (screen === 'auth') {
    return <AuthPage />
  }

  if (screen === 'survey') {
    return <SurveyPage mode="initial" onComplete={handleSurveyComplete} />
  }

  if (screen === 'survey-change-teacher') {
    return (
      <SurveyPage
        mode="changeTeacher"
        onComplete={() => setScreen('chat')}
      />
    )
  }

  if (screen === 'survey-update-profile') {
    return (
      <SurveyPage
        mode="updateProfile"
        onComplete={() => setScreen('settings')}
      />
    )
  }

  if (screen === 'settings') {
    return (
      <SettingsPage
        onChangeTeacher={() => setScreen('survey-change-teacher')}
        onUpdateProfile={() => setScreen('survey-update-profile')}
        onBack={() => setScreen('chat')}
        onLogout={() => setScreen('auth')}
      />
    )
  }

  if (screen === 'plan') {
    return <PlanSelectPage reason="expired" onSelect={() => setScreen('chat')} user={user} />
  }

  if (screen === 'plan-device') {
    return <PlanSelectPage reason="deviceLimit" onSelect={() => setScreen('survey')} user={user} />
  }

  if (screen === 'chat') {
    const plan = get('user:plan') || 'trial'
    const trialStart = get('user:trialStart')
    if (plan === 'trial' && isTrialExpired(trialStart)) {
      return <PlanSelectPage onSelect={() => setScreen('chat')} user={user} />
    }
    return (
      <ChatPage onNavigateSettings={() => setScreen('settings')} onSaveToCloud={saveToCloud} />
    )
  }

  return null
}
