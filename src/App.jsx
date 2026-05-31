import { useState, useEffect } from 'react'
import { useStorage } from './hooks/useStorage'
import SurveyPage from './pages/SurveyPage'
import ChatPage from './pages/ChatPage'
import SettingsPage from './pages/SettingsPage'

const MAINTENANCE = true

export default function App() {
  if (MAINTENANCE) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          <div className="text-5xl mb-4">🔧</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">メンテナンス中です</h1>
          <p className="text-sm text-gray-500">現在システムのメンテナンスを行っています。<br />しばらくお待ちください。</p>
        </div>
      </div>
    )
  }

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
