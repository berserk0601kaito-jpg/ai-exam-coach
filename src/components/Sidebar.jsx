import TeacherCard from './TeacherCard'

const NAV_ITEMS = [
  { id: 'chat',     icon: '💬', label: '面談' },
  { id: 'scores',   icon: '📊', label: '成績' },
  { id: 'calendar', icon: '📅', label: 'カレンダー' },
  { id: 'books',    icon: '📚', label: '計画' },
  { id: 'settings', icon: '⚙️', label: '設定' },
]

export default function Sidebar({ currentPage, onNavigate, teacher }) {
  return (
    <>
      {/* PC: 左サイドバー */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-full flex-shrink-0">
        <div className="p-5 border-b border-gray-100">
          <TeacherCard teacher={teacher} />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.filter(i => i.id !== 'settings').map((item) => (
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

      {/* スマホ: ボトムナビゲーション */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              currentPage === item.id
                ? 'text-indigo-600'
                : 'text-gray-400'
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
