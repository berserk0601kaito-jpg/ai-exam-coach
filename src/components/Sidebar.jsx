import TeacherCard from './TeacherCard'
import { useStorage } from '../hooks/useStorage'
import { getJSTDateString } from '../lib/date'

const NAV_ITEMS = [
  { id: 'chat',     icon: '💬', label: '面談' },
  { id: 'scores',   icon: '📊', label: '成績' },
  { id: 'calendar', icon: '📅', label: 'カレンダー' },
  { id: 'books',    icon: '📚', label: '計画・参考書' },
]

export default function Sidebar({ currentPage, onNavigate, teacher }) {
  const { get } = useStorage()

  const plan = get('user:plan') || 'trial'
  const trialStart = get('user:trialStart')
  const today = getJSTDateString()
  const trialDaysLeft = trialStart
    ? Math.max(0, 3 - Math.floor((new Date(today) - new Date(trialStart)) / 86400000))
    : 3

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
      <div className="p-5 border-b border-gray-100">
        <TeacherCard teacher={teacher} />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentPage === item.id
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-gray-100">
        {plan === 'trial' && (
          <div className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2 mb-2 text-center">
            無料トライアル残り <span className="font-bold">{trialDaysLeft}</span> 日
          </div>
        )}
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentPage === 'settings'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <span className="text-base">⚙️</span>
          設定
        </button>
      </div>
    </div>
  )
}
