import { useState } from 'react'
import { useStorage } from '../hooks/useStorage'
import { useBooks, PROGRESS_STATES } from '../hooks/useBooks'
import { useUsage } from '../hooks/useUsage'
import { callClaude, HAIKU } from '../lib/anthropic'

const BOOK_SUBJECTS = ['英語', '数学', '国語', '物理', '化学', '生物', '地学', '地理', '日本史', '世界史', '政治・経済', '倫理', '情報', 'その他']
const LEVELS = ['入門', '基礎', '標準', '応用', '発展']

const PROGRESS_COLORS = { '未着手': 'bg-gray-100 text-gray-500', '進行中': 'bg-amber-100 text-amber-700', '完了': 'bg-emerald-100 text-emerald-700' }

// ── 共通ヘッダー ──────────────────────────────────────
function PageHeader({ title, subtitle, onBack }) {
  return (
    <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center gap-3 flex-shrink-0">
      {onBack && (
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg leading-none">←</button>
      )}
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

// ── 参考書追加モーダル ────────────────────────────────
function AddBookModal({ onClose, onSave, initialTitle = '' }) {
  const [title, setTitle] = useState(initialTitle)
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!title.trim()) { setError('書名を入力してください'); return }
    if (!subject) { setError('科目を選択してください'); return }
    onSave({ title: title.trim(), subject, level, notes: notes.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">参考書を登録</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">✕</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">書名</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError('') }}
              placeholder="例：大岩のいちばんはじめの英文法"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">科目</label>
            <div className="flex flex-wrap gap-2">
              {BOOK_SUBJECTS.map((s) => (
                <button key={s} type="button" onClick={() => { setSubject(s); setError('') }}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${subject === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">レベル（任意）</label>
            <div className="flex gap-2 flex-wrap">
              {LEVELS.map((l) => (
                <button key={l} type="button" onClick={() => setLevel(l === level ? '' : l)}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${level === l ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ（任意）</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="使い方・感想など"
              rows={2}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700">
            登録する
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ホーム ────────────────────────────────────────────
function HomeView({ onNavigate }) {
  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-gray-500 mb-5">何をしますか？</p>
      <button onClick={() => onNavigate('books-menu')}
        className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-indigo-400 hover:shadow-sm transition-all">
        <div className="text-3xl mb-2">📚</div>
        <p className="font-semibold text-gray-800">おすすめ参考書を知りたい</p>
        <p className="text-xs text-gray-400 mt-1">AIに提案してもらう・自分の参考書を管理する</p>
      </button>
      <button onClick={() => onNavigate('plan')}
        className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-indigo-400 hover:shadow-sm transition-all">
        <div className="text-3xl mb-2">📅</div>
        <p className="font-semibold text-gray-800">勉強計画を立てたい</p>
        <p className="text-xs text-gray-400 mt-1">1日の勉強時間をもとにAIが計画を作る</p>
      </button>
    </div>
  )
}

// ── 参考書メニュー ────────────────────────────────────
function BooksMenuView({ onNavigate }) {
  const MENU = [
    { id: 'ai-recommend', icon: '🤖', label: 'AIにおすすめを聞く', desc: '科目・レベル・悩みを入力すると提案してくれる' },
    { id: 'my-books',     icon: '📋', label: 'マイ参考書を登録・管理', desc: '進捗や感想を記録する' },
    { id: 'ai-advise',   icon: '✨', label: '登録済み参考書でAIに相談', desc: '登録した本をもとにアドバイス → そのまま計画も立てられる' },
  ]
  return (
    <div className="p-4 space-y-3">
      {MENU.map((item) => (
        <button key={item.id} onClick={() => onNavigate(item.id)}
          className="w-full bg-white border-2 border-gray-200 rounded-2xl p-4 text-left hover:border-indigo-400 hover:shadow-sm transition-all">
          <p className="text-2xl mb-1">{item.icon}</p>
          <p className="font-semibold text-gray-800">{item.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
        </button>
      ))}
    </div>
  )
}

// ── AI提案 ────────────────────────────────────────────
function AiRecommendView({ onNavigate, onAddBook }) {
  const { get } = useStorage()
  const { checkUsageLimit, incrementUsage, getRemainingCount } = useUsage()
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('')
  const [concerns, setConcerns] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const teacher = get('user:teacher')
  const profile = get('user:profile')

  const handleSubmit = async () => {
    if (!subject) { setError('科目を選択してください'); return }
    if (!checkUsageLimit()) { setError(`残り回数が0回です。また明日！`); return }
    setLoading(true)
    setError('')
    setResult('')
    try {
      const prompt = `大学受験生へのおすすめ参考書を3〜5冊提案してください。

科目: ${subject}
現在のレベル: ${level || '不明'}
志望校: ${profile?.targetSchool || '不明'}
悩み・要望: ${concerns || 'なし'}

各参考書について以下の形式で答えてください：
【書名】
・対象レベル：
・おすすめ理由：（2〜3文）
・使い方のポイント：（1文）`

      const text = await callClaude({
        system: teacher?.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        model: HAIKU,
      })
      incrementUsage()
      setResult(text)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">科目</label>
        <div className="flex flex-wrap gap-2">
          {BOOK_SUBJECTS.filter(s => s !== 'その他').map((s) => (
            <button key={s} type="button" onClick={() => { setSubject(s); setError('') }}
              className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${subject === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">現在のレベル（任意）</label>
        <div className="flex gap-2 flex-wrap">
          {LEVELS.map((l) => (
            <button key={l} type="button" onClick={() => setLevel(l === level ? '' : l)}
              className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${level === l ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">悩み・要望（任意）</label>
        <textarea
          value={concerns}
          onChange={(e) => setConcerns(e.target.value)}
          placeholder="例：単語は覚えたけど読解が苦手"
          rows={2}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
        {loading ? 'AIが提案中…' : `提案してもらう（残り${getRemainingCount()}回）`}
      </button>

      {result && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-indigo-700 mb-2">{teacher?.icon || '🎓'} {teacher?.name || '先生'}のおすすめ</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setShowAddModal(true)}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-indigo-700">
              参考書を登録する
            </button>
            <button onClick={() => onNavigate('plan')}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-xs font-semibold hover:bg-gray-200">
              計画を立てる →
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddBookModal
          onClose={() => setShowAddModal(false)}
          onSave={(book) => { onAddBook(book); setShowAddModal(false) }}
        />
      )}
    </div>
  )
}

// ── マイ参考書 ────────────────────────────────────────
function MyBooksView({ onNavigate }) {
  const { getAll, add, remove, update } = useBooks()
  const [books, setBooks] = useState(() => getAll())
  const [showAdd, setShowAdd] = useState(false)

  const refresh = () => setBooks(getAll())

  const handleAdd = (book) => { add(book); refresh(); setShowAdd(false) }
  const handleDelete = (id) => { if (!window.confirm('削除しますか？')) return; remove(id); refresh() }
  const cycleProgress = (id, current) => {
    const next = PROGRESS_STATES[(PROGRESS_STATES.indexOf(current) + 1) % PROGRESS_STATES.length]
    update(id, { progress: next })
    refresh()
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">登録済み参考書 {books.length}冊</p>
        <button onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-700">
          + 追加
        </button>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📖</div>
          <p className="font-medium text-gray-500">参考書を登録しよう</p>
          <p className="text-xs mt-1">「+ 追加」から登録できます</p>
        </div>
      ) : (
        <>
          {books.map((book) => (
            <div key={book.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm leading-snug">{book.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {book.subject}{book.level ? `・${book.level}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => cycleProgress(book.id, book.progress)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${PROGRESS_COLORS[book.progress]}`}
                >
                  {book.progress}
                </button>
              </div>
              {book.notes && (
                <p className="text-xs text-gray-500 mt-2 italic">{book.notes}</p>
              )}
              <div className="flex justify-end mt-2">
                <button onClick={() => handleDelete(book.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50">
                  削除
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => onNavigate('ai-advise')}
            className="w-full bg-indigo-50 text-indigo-700 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-100 mt-2">
            AIにアドバイスをもらう →
          </button>
        </>
      )}

      {showAdd && (
        <AddBookModal onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
    </div>
  )
}

// ── 登録済み参考書でAI相談 ────────────────────────────
function AiAdviseView({ onNavigate }) {
  const { get } = useStorage()
  const { getAll } = useBooks()
  const { checkUsageLimit, incrementUsage, getRemainingCount } = useUsage()
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const books = getAll()
  const teacher = get('user:teacher')
  const profile = get('user:profile')

  const handleAdvise = async () => {
    if (books.length === 0) { setError('まず参考書を登録してください'); return }
    if (!checkUsageLimit()) { setError('残り回数が0回です。また明日！'); return }
    setLoading(true)
    setError('')
    setResult('')
    try {
      const bookList = books.map((b) => `・${b.title}（${b.subject}${b.level ? '・' + b.level : ''}）[${b.progress}]`).join('\n')
      const prompt = `以下の参考書を使っている受験生へのアドバイスをしてください。

志望校: ${profile?.targetSchool || '不明'}
使用参考書:
${bookList}

各参考書の進め方・優先度・組み合わせ方のアドバイスをしてください。`

      const text = await callClaude({
        system: teacher?.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        model: HAIKU,
      })
      incrementUsage()
      setResult(text)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 mb-2">登録済み参考書 {books.length}冊</p>
        {books.length === 0 ? (
          <p className="text-sm text-gray-400">参考書がありません。先に登録してください。</p>
        ) : (
          <div className="space-y-1.5">
            {books.map((b) => (
              <div key={b.id} className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${PROGRESS_COLORS[b.progress]}`}>{b.progress}</span>
                <span className="text-sm text-gray-700">{b.title}</span>
                <span className="text-xs text-gray-400">({b.subject})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button onClick={handleAdvise} disabled={loading || books.length === 0}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
        {loading ? 'AIが分析中…' : `AIにアドバイスをもらう（残り${getRemainingCount()}回）`}
      </button>

      {result && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-indigo-700 mb-2">{teacher?.icon || '🎓'} {teacher?.name || '先生'}のアドバイス</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
          <button onClick={() => onNavigate('plan')}
            className="mt-4 w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
            このままAIと計画を立てる →
          </button>
        </div>
      )}
    </div>
  )
}

// ── 計画立て ──────────────────────────────────────────
function PlanView({ onNavigate }) {
  const { get, set } = useStorage()
  const { getAll } = useBooks()
  const { checkUsageLimit, incrementUsage, getRemainingCount } = useUsage()
  const [hours, setHours] = useState('')
  const [selectedBooks, setSelectedBooks] = useState([])
  const [freeBooks, setFreeBooks] = useState('')
  const [result, setResult] = useState(() => get('user:latestPlan') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const books = getAll()
  const teacher = get('user:teacher')
  const profile = get('user:profile')

  const toggleBook = (id) => {
    setSelectedBooks((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const handleCreate = async () => {
    if (!hours || Number(hours) <= 0) { setError('1日の勉強時間を入力してください'); return }
    if (!checkUsageLimit()) { setError('残り回数が0回です。また明日！'); return }
    setLoading(true)
    setError('')
    setResult('')
    try {
      const usedBooks = books.filter((b) => selectedBooks.includes(b.id))
      const registeredLines = usedBooks.map((b) => `・${b.title}（${b.subject}${b.level ? '・' + b.level : ''}）[${b.progress}]`)
      const freeLines = freeBooks.trim() ? freeBooks.trim().split('\n').filter(Boolean).map((l) => `・${l.trim()}`) : []
      const allBookLines = [...registeredLines, ...freeLines]
      const bookSection = allBookLines.length > 0
        ? `使用参考書:\n${allBookLines.join('\n')}`
        : '参考書: 未登録'

      const today = new Date().toISOString().split('T')[0]
      const prompt = `以下の条件で、大学受験に向けた具体的な学習計画を立ててください。

志望校: ${profile?.targetSchool || '不明'}
学年: ${profile?.grade || '不明'}
1日の勉強時間: ${hours}時間
今日の日付: ${today}
${bookSection}

週間スケジュール・各科目の優先度・1日ごとの目安量を含めた実践的な計画を作ってください。`

      const text = await callClaude({
        system: teacher?.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        model: HAIKU,
      })
      incrementUsage()
      set('user:latestPlan', text)
      setResult(text)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          1日何時間勉強できますか？
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={hours}
            onChange={(e) => { setHours(e.target.value); setError('') }}
            placeholder="3"
            min="0.5"
            max="16"
            step="0.5"
            className="w-28 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <span className="text-sm text-gray-600">時間 / 日</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          使用する参考書名
          <span className="ml-1 text-xs font-normal text-gray-400">（1行に1冊ずつ）</span>
        </label>
        <textarea
          value={freeBooks}
          onChange={(e) => setFreeBooks(e.target.value)}
          placeholder={'例：\n大岩のいちばんはじめの英文法\n青チャート 数学ⅠA\nシステム英単語'}
          rows={4}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>

      {books.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            計画に含める参考書（任意）
          </label>
          <div className="space-y-2">
            {books.map((b) => (
              <button key={b.id} type="button" onClick={() => toggleBook(b.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                  selectedBooks.includes(b.id)
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}>
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedBooks.includes(b.id) ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                }`}>
                  {selectedBooks.includes(b.id) && <span className="text-white text-xs">✓</span>}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{b.title}</p>
                  <p className="text-xs text-gray-400">{b.subject}{b.level ? `・${b.level}` : ''} / {b.progress}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button onClick={handleCreate} disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
        {loading ? 'AIが計画を作成中…' : `計画を作ってもらう（残り${getRemainingCount()}回）`}
      </button>

      {result && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-indigo-700 mb-2">{get('user:teacher')?.icon || '🎓'} {get('user:teacher')?.name || '先生'}の学習計画</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
        </div>
      )}
    </div>
  )
}

// ── メインページ ──────────────────────────────────────
export default function BooksPage() {
  const { getAll: getAllBooks, add: addBook } = useBooks()
  const [view, setView] = useState('home')
  const [history, setHistory] = useState([])

  const navigate = (v) => { setHistory((h) => [...h, view]); setView(v) }
  const goBack = () => {
    if (!history.length) return
    setView(history[history.length - 1])
    setHistory((h) => h.slice(0, -1))
  }

  const handleAddBook = (book) => { addBook(book) }

  const HEADERS = {
    home:          { title: '計画・参考書', subtitle: null },
    'books-menu':  { title: '参考書', subtitle: 'おすすめを知る・管理する' },
    'ai-recommend':{ title: 'AIにおすすめを聞く', subtitle: '科目・レベル・悩みを入力' },
    'my-books':    { title: 'マイ参考書', subtitle: '登録・進捗管理' },
    'ai-advise':   { title: 'AI相談', subtitle: '登録済み参考書をもとにアドバイス' },
    plan:          { title: '学習計画を立てる', subtitle: 'AIが計画を作成します' },
  }

  const header = HEADERS[view] || HEADERS.home

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader title={header.title} subtitle={header.subtitle} onBack={view !== 'home' ? goBack : null} />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {view === 'home'          && <HomeView onNavigate={navigate} />}
        {view === 'books-menu'    && <BooksMenuView onNavigate={navigate} />}
        {view === 'ai-recommend'  && <AiRecommendView onNavigate={navigate} onAddBook={handleAddBook} />}
        {view === 'my-books'      && <MyBooksView onNavigate={navigate} />}
        {view === 'ai-advise'     && <AiAdviseView onNavigate={navigate} />}
        {view === 'plan'          && <PlanView onNavigate={navigate} />}
      </div>
    </div>
  )
}
