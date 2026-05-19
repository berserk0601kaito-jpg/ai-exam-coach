import { useState, useEffect, useCallback } from 'react'
import { useStorage } from '../hooks/useStorage'
import { useChat } from '../hooks/useChat'
import { callClaude, isMockMode, HAIKU } from '../lib/anthropic'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import MessageInput from '../components/MessageInput'
import ScoresPage from './ScoresPage'
import BooksPage from './BooksPage'
import CalendarPage from './CalendarPage'
import { useReminder } from '../hooks/useReminder'

function ComingSoon({ label }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-400">
        <div className="text-5xl mb-4">🚧</div>
        <p className="font-medium text-gray-600">{label}</p>
        <p className="text-sm mt-1">フェーズ3以降で実装予定です</p>
      </div>
    </div>
  )
}

export default function ChatPage({ onNavigateSettings }) {
  const { get, set } = useStorage()
  const { sendMessage, retry, isLoading, error, setError, getRemainingCount } = useChat()
  useReminder()

  const [messages, setMessages] = useState([])
  const [currentPage, setCurrentPage] = useState('chat')
  const [teacher, setTeacher] = useState(null)
  const [autoStarting, setAutoStarting] = useState(false)

  const initChat = useCallback(async () => {
    const storedTeacher = get('user:teacher')
    const profile = get('user:profile')
    setTeacher(storedTeacher)

    const history = get('user:history') || []
    setMessages(history)

    const today = new Date().toISOString().split('T')[0]
    const lastLogin = profile?.lastLoginDate
    const daysSince = lastLogin
      ? Math.floor((new Date(today) - new Date(lastLogin)) / 86400000)
      : 999

    const shouldAutoStart = history.length === 0 || daysSince >= 7

    set('user:profile', { ...profile, lastLoginDate: today })

    if (shouldAutoStart && storedTeacher) {
      setAutoStarting(true)
      try {
        const triggerContent =
          history.length === 0
            ? '(初回セッション開始。生徒への最初のメッセージを送ってください。)'
            : `(${daysSince}日ぶりのセッション再開。久しぶりの挨拶メッセージを送ってください。)`

        const messages = history.length > 0
          ? [...history, { role: 'user', content: triggerContent }]
          : [{ role: 'user', content: triggerContent }]

        const text = await callClaude({
          system: storedTeacher.systemPrompt,
          messages: messages.slice(-30),
          model: HAIKU,
        })

        const newHistory = [...history, { role: 'assistant', content: text }]
        set('user:history', newHistory)
        setMessages(newHistory)
      } catch (err) {
        console.error('Auto-start failed:', err)
      } finally {
        setAutoStarting(false)
      }
    }
  }, [get, set])

  useEffect(() => {
    initChat()
  }, [])

  const handleSend = async (content) => {
    const updated = await sendMessage(content)
    if (updated) setMessages(updated)
  }

  const handleRetry = async () => {
    const updated = await retry()
    if (updated) setMessages(updated)
  }

  const handleNavigate = (page) => {
    if (page === 'settings') {
      onNavigateSettings()
      return
    }
    setCurrentPage(page)
    setError(null)
  }

  const remaining = getRemainingCount()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} teacher={teacher} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentPage === 'chat' && (
          <>
            <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center gap-2">
              <span className="text-lg">{teacher?.icon || '🎓'}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{teacher?.name || '講師'} との面談</p>
                <p className="text-xs text-gray-400">{teacher?.style}</p>
              </div>
              {isMockMode() && (
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-1 rounded-lg font-medium">
                  モックモード
                </span>
              )}
            </div>
            <ChatWindow
              messages={messages}
              isLoading={isLoading || autoStarting}
              teacherIcon={teacher?.icon}
            />
            <MessageInput
              onSend={handleSend}
              onRetry={handleRetry}
              isLoading={isLoading || autoStarting}
              error={error}
              remainingCount={remaining}
            />
          </>
        )}
        {currentPage === 'scores'   && <ScoresPage />}
        {currentPage === 'calendar' && <CalendarPage />}
        {currentPage === 'books'    && <BooksPage />}
      </div>
    </div>
  )
}
