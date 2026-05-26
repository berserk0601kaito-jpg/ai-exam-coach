import { useState, useEffect } from 'react'
import { useStorage } from './hooks/useStorage'
import SurveyPage from './pages/SurveyPage'
import ChatPage from './pages/ChatPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const { get } = useStorage()
  const [screen, setScreen] = useState('loading')

  useEffect(() => {
    const profile = get('user:profile')
    const teacher = get('user:teacher')
    setScreen(profile && teacher ? 'chat' : 'survey')
  }, [])

  if (screen === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (screen === 'survey') {
    return <SurveyPage mode="initial" onComplete={() => setScreen('chat')} />
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
      />
    )
  }

  return <ChatPage onNavigateSettings={() => setScreen('settings')} />
}
