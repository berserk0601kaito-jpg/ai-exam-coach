import { useState, useMemo, useEffect } from 'react'
import { useCalendar, CATEGORIES, CATEGORY_STYLE } from '../hooks/useCalendar'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getCalendarGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const grid = []

  for (let i = firstDow - 1; i >= 0; i--) {
    grid.push({ date: new Date(year, month, -i), curr: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({ date: new Date(year, month, d), curr: true })
  }
  while (grid.length < 42) {
    const d = grid.length - firstDow - daysInMonth + 1
    grid.push({ date: new Date(year, month + 1, d), curr: false })
  }
  return grid
}

// ── イベント追加モーダル ──────────────────────────────────
function AddEventModal({ defaultDate, onClose, onSave }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('')
  const [category, setCategory] = useState('その他')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!title.trim()) { setError('タイトルを入力してください'); return }
    onSave({ title: title.trim(), date, time, category, notes: notes.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">予定を追加</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">✕</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError('') }}
              placeholder="例：全統模試、部活の大会"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">時刻（任意）</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-colors font-medium ${
                    category === cat
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${CATEGORY_STYLE[cat].dot}`} />
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ（任意）</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="会場・持ち物など"
              rows={2}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700"
          >
            追加する
          </button>
        </div>
      </div>
    </div>
  )
}

// ── イベントバッジ ────────────────────────────────────────
function EventBadge({ event, onDelete }) {
  const style = CATEGORY_STYLE[event.category] || CATEGORY_STYLE['その他']
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${style.badge}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{event.title}</p>
          <p className="text-xs opacity-70">
            {event.time && <span className="mr-2">{event.time}</span>}
            {event.category}
            {event.notes && <span className="ml-2 italic">・{event.notes}</span>}
          </p>
        </div>
      </div>
      <button
        onClick={() => onDelete(event.id)}
        className="shrink-0 ml-2 text-xs opacity-40 hover:opacity-80 px-1.5 py-0.5 rounded-lg hover:bg-black/10"
      >
        ✕
      </button>
    </div>
  )
}

// ── メインページ ──────────────────────────────────────────
function getDatePlusDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

export default function CalendarPage() {
  const { getAll, add, remove, getByDate, getUpcoming } = useCalendar()
  const today = toDateStr(new Date())
  const twoDaysLater = getDatePlusDays(2)

  const [displayDate, setDisplayDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [showAdd, setShowAdd] = useState(false)
  const [, forceUpdate] = useState(0)
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  const requestNotif = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setNotifPermission(result)
  }

  const year  = displayDate.getFullYear()
  const month = displayDate.getMonth()

  const grid = useMemo(() => getCalendarGrid(year, month), [year, month])

  const allEvents = getAll()
  const eventsByDate = useMemo(() => {
    const map = {}
    allEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [allEvents])

  const selectedEvents = getByDate(selectedDate)
  const upcomingEvents = getUpcoming(8)

  const prevMonth = () => setDisplayDate(new Date(year, month - 1, 1))
  const nextMonth = () => setDisplayDate(new Date(year, month + 1, 1))

  const handleAdd = (event) => {
    add(event)
    setSelectedDate(event.date)
    setShowAdd(false)
    forceUpdate((n) => n + 1)
  }

  const handleDelete = (id) => {
    remove(id)
    forceUpdate((n) => n + 1)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-800">カレンダー</p>
          <p className="text-xs text-gray-400">模試・部活・予定を管理</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          + 追加
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* 通知許可バナー */}
        {notifPermission === 'default' && (
          <div className="mx-4 mt-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-xl">🔔</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">2日前リマインド通知</p>
              <p className="text-xs text-amber-600">予定の2日前にブラウザ通知でお知らせします</p>
            </div>
            <button
              onClick={requestNotif}
              className="shrink-0 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-600"
            >
              有効にする
            </button>
          </div>
        )}
        {notifPermission === 'granted' && (getAll().filter(e => e.date === twoDaysLater)).length > 0 && (
          <div className="mx-4 mt-4 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-indigo-700 mb-1.5">🔔 2日後の予定（リマインド済み）</p>
            <div className="space-y-1">
              {getAll().filter(e => e.date === twoDaysLater).map(e => (
                <p key={e.id} className="text-sm text-indigo-800">・{e.title}（{twoDaysLater.replace(/-/g, '/')}）</p>
              ))}
            </div>
          </div>
        )}
        {/* カレンダー本体 */}
        <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden">
          {/* 月ナビゲーション */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">‹</button>
            <div className="text-center">
              <p className="text-base font-bold text-gray-800">{year}年{month + 1}月</p>
            </div>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">›</button>
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className={`py-2 text-center text-xs font-semibold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7">
            {grid.map(({ date, curr }, idx) => {
              const ds       = toDateStr(date)
              const isToday  = ds === today
              const isSel    = ds === selectedDate
              const dow      = date.getDay()
              const dayEvents = eventsByDate[ds] || []
              const dots     = dayEvents.slice(0, 3)

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(ds)}
                  className={`relative min-h-[52px] py-1.5 flex flex-col items-center border-b border-r border-gray-50 transition-colors ${
                    isSel ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isToday
                      ? 'bg-indigo-600 text-white'
                      : isSel
                      ? 'text-indigo-700 font-bold'
                      : !curr
                      ? 'text-gray-300'
                      : dow === 0
                      ? 'text-red-400'
                      : dow === 6
                      ? 'text-blue-400'
                      : 'text-gray-700'
                  }`}>
                    {date.getDate()}
                  </span>
                  {dots.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dots.map((e, i) => (
                        <span key={i} className={`w-1.5 h-1.5 rounded-full ${CATEGORY_STYLE[e.category]?.dot || 'bg-gray-400'}`} />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] text-gray-400 leading-none ml-0.5">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* カテゴリ凡例 */}
        <div className="mx-4 mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${CATEGORY_STYLE[cat].dot}`} />
              <span className="text-xs text-gray-500">{cat}</span>
            </div>
          ))}
        </div>

        {/* 選択日のイベント一覧 */}
        <div className="mx-4 mt-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">
              {selectedDate === today ? '今日' : selectedDate.replace(/-/g, '/')}　の予定
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + この日に追加
            </button>
          </div>

          {selectedEvents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">予定なし</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((e) => (
                <EventBadge key={e.id} event={e} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {/* 直近の予定 */}
          {upcomingEvents.filter((e) => e.date !== selectedDate).length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">直近の予定</p>
              <div className="space-y-2">
                {upcomingEvents
                  .filter((e) => e.date !== selectedDate)
                  .slice(0, 5)
                  .map((e) => (
                    <div key={e.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 shadow-sm">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_STYLE[e.category]?.dot || 'bg-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{e.title}</p>
                        <p className="text-xs text-gray-400">{e.date.replace(/-/g, '/')}{e.time && ` ${e.time}`}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_STYLE[e.category]?.badge}`}>{e.category}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddEventModal
          defaultDate={selectedDate}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}
    </div>
  )
}
