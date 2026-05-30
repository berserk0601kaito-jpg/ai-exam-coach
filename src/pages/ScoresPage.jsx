import { useState } from 'react'
import { useStorage } from '../hooks/useStorage'
import { useScores } from '../hooks/useScores'
import { callClaude, HAIKU } from '../lib/anthropic'

// ── 科目定義 ────────────────────────────────────────────
const EXAM_TYPES = ['定期テスト', '記述模試', '共通テスト模試']

const TEIKI_SUBJECTS = {
  '国語':   ['現代の国語', '言語文化', '論理国語', '文学国語', '国語表現', '古典探究'],
  '社会':   ['地理総合', '地理探究', '歴史総合', '世界史探究', '日本史探究'],
  '公民':   ['公共', '倫理', '政治・経済'],
  '数学':   ['数学Ⅰ', '数学A', '数学Ⅱ', '数学B', '数学Ⅲ', '数学C'],
  '理科':   ['科学と人間生活', '物理', '物理基礎', '化学', '化学基礎', '生物', '生物基礎', '地学', '地学基礎'],
  '英語':   ['英語コミュニケーション', '英語 論理・表現'],
  'その他': ['音楽', '美術', '書道', '家庭', '理数', '情報Ⅰ', '情報Ⅱ', '保健体育'],
}

const KIJUTSU_SUBJECTS = [
  '数学', '国語', '英語', '物理', '化学', '生物', '地学',
  '地理総合', '地理探究', '歴史総合', '世界史探究', '日本史探究',
  '公民', '公共', '倫理', '政治・経済',
]

const KYOTSU_SUBJECTS = {
  '国語':         ['国語'],
  '地理歴史・公民': ['地理総合，地理探究', '歴史総合，日本史探究', '歴史総合，世界史探究', '公共，倫理', '公共，政治・経済', '地理総合／歴史総合／公共'],
  '数学':         ['数学Ⅰ，数学A', '数学Ⅰ', '数学Ⅱ，数学B，数学C'],
  '理科':         ['物理基礎', '化学基礎', '生物基礎', '地学基礎', '物理', '化学', '生物', '地学'],
  '外国語':       ['英語', 'ドイツ語', 'フランス語', '中国語', '韓国語', 'リスニング（英語のみ）'],
  '情報':         ['情報Ⅰ'],
}

const KYOTSU_50_SUBJECTS = new Set(['物理基礎', '化学基礎', '生物基礎', '地学基礎'])

function defaultMax(examType, subject) {
  if (examType === '共通テスト模試') {
    if (subject === '国語') return '200'
    if (KYOTSU_50_SUBJECTS.has(subject)) return '50'
  }
  return '100'
}

// ── 共通UI部品 ───────────────────────────────────────────
function PercentBar({ pct }) {
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

function ToggleBtn({ label, active, onClick, small = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border rounded-xl font-medium transition-colors ${
        small ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-sm'
      } ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
      }`}
    >
      {label}
    </button>
  )
}

// ── 科目選択UI ───────────────────────────────────────────
function SubjectSelector({ examType, selected, onToggle }) {
  if (examType === '記述模試') {
    return (
      <div className="flex flex-wrap gap-2">
        {KIJUTSU_SUBJECTS.map((name) => (
          <ToggleBtn key={name} label={name} active={selected.includes(name)} onClick={() => onToggle(name)} />
        ))}
      </div>
    )
  }

  const groups = examType === '定期テスト' ? TEIKI_SUBJECTS : KYOTSU_SUBJECTS
  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([cat, subjects]) => (
        <div key={cat}>
          <p className="text-xs font-semibold text-gray-400 mb-2">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {subjects.map((name) => (
              <ToggleBtn key={name} label={name} small active={selected.includes(name)} onClick={() => onToggle(name)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 成績追加モーダル ─────────────────────────────────────
function AddScoreModal({ onClose, onSave }) {
  const { get, set } = useStorage()
  const today = new Date().toISOString().split('T')[0]

  // step: 'type' | 'sameOrChange' | 'subjects' | 'scores'
  const [step, setStep]           = useState('type')
  const [examType, setExamType]   = useState(null)
  const [selected, setSelected]   = useState([])
  const [examName, setExamName]   = useState('')
  const [date, setDate]           = useState(today)
  const [scoreInputs, setScoreInputs] = useState({}) // { name: { score, max } }
  const [notes, setNotes]         = useState('')
  const [error, setError]         = useState('')

  const lastSubjectsAll = get('user:lastSubjects') || {}

  // ── 型選択後の遷移
  const handleSelectType = (type) => {
    setExamType(type)
    setError('')
    const last = lastSubjectsAll[type]
    if (last && last.length > 0) {
      setStep('sameOrChange')
    } else {
      setSelected([])
      setStep('subjects')
    }
  }

  // ── 「前回と同じ」
  const handleSameAsLast = () => {
    const last = lastSubjectsAll[examType] || []
    setSelected(last)
    const inputs = {}
    last.forEach((name) => {
      inputs[name] = { score: '', max: defaultMax(examType, name) }
    })
    setScoreInputs(inputs)
    setStep('scores')
  }

  // ── 「科目を変更する」
  const handleChangeSubjects = () => {
    const last = lastSubjectsAll[examType] || []
    setSelected(last) // 前回を初期選択状態にして変更しやすく
    setStep('subjects')
  }

  // ── 科目トグル
  const toggleSubject = (name) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    )
    setError('')
  }

  // ── 科目選択 → 点数入力へ
  const handleToScores = () => {
    if (selected.length === 0) { setError('科目を1つ以上選択してください'); return }
    const inputs = {}
    selected.forEach((name) => {
      inputs[name] = { score: '', max: defaultMax(examType, name) }
    })
    setScoreInputs(inputs)
    setError('')
    setStep('scores')
  }

  const updateInput = (name, field, val) => {
    setScoreInputs((prev) => ({ ...prev, [name]: { ...prev[name], [field]: val } }))
    setError('')
  }

  // ── 保存
  const handleSave = () => {
    const missing = selected.filter((name) => scoreInputs[name]?.score === '')
    if (missing.length > 0) { setError(`${missing.join('・')}の点数を入力してください`); return }
    const subjects = selected.map((name) => ({
      name,
      score: Number(scoreInputs[name].score),
      max:   Number(scoreInputs[name].max) || 100,
    }))
    // 最後の科目選択を記憶
    set('user:lastSubjects', { ...lastSubjectsAll, [examType]: selected })
    onSave({ examType, examName: examName.trim() || examType, date, subjects, notes: notes.trim() })
  }

  // ── 戻る処理
  const goBack = () => {
    setError('')
    if (step === 'sameOrChange') { setStep('type'); setExamType(null) }
    else if (step === 'subjects') {
      const last = lastSubjectsAll[examType]
      setStep(last && last.length > 0 ? 'sameOrChange' : 'type')
    }
    else if (step === 'scores') { setStep('subjects') }
  }

  const stepLabels = { type: '試験タイプ', sameOrChange: '科目', subjects: '科目選択', scores: '点数入力' }
  const stepOrder  = ['type', 'sameOrChange', 'subjects', 'scores']
  const currentIdx = stepOrder.indexOf(step)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="p-5 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {step !== 'type' && (
                <button onClick={goBack} className="text-gray-400 hover:text-gray-600 text-lg leading-none">←</button>
              )}
              <h2 className="text-lg font-bold text-gray-800">成績を追加</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">✕</button>
          </div>
          {/* ステップバー */}
          <div className="flex gap-1 mb-4">
            {stepOrder.filter((s) => {
              if (s === 'sameOrChange') return !!(lastSubjectsAll[examType]?.length)
              return true
            }).map((s, i, arr) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${stepOrder.indexOf(s) <= currentIdx ? 'bg-indigo-500' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {/* コンテンツ（スクロール） */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">

          {/* Step: type */}
          {step === 'type' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">受験した試験の種類を選んでください</p>
              {EXAM_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleSelectType(type)}
                  className="w-full bg-white border-2 border-gray-200 rounded-2xl p-4 text-left hover:border-indigo-400 hover:shadow-sm transition-all"
                >
                  <p className="font-semibold text-gray-800">{type}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {type === '定期テスト' && '学校の定期テスト（詳細な科目選択）'}
                    {type === '記述模試' && '全統模試・駿台模試など記述形式の模試'}
                    {type === '共通テスト模試' && '共通テスト形式の模試・プレテスト'}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Step: sameOrChange */}
          {step === 'sameOrChange' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">前回の{examType}と同じ科目ですか？</p>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-2">前回の科目</p>
                <div className="flex flex-wrap gap-1.5">
                  {(lastSubjectsAll[examType] || []).map((s) => (
                    <span key={s} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">{s}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSameAsLast}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700"
              >
                前回と同じ → 点数入力へ
              </button>
              <button
                onClick={handleChangeSubjects}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200"
              >
                科目を変更する
              </button>
            </div>
          )}

          {/* Step: subjects */}
          {step === 'subjects' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">受験した科目を選んでください（複数可）</p>
              <SubjectSelector examType={examType} selected={selected} onToggle={toggleSubject} />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={handleToScores}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 mt-2"
              >
                点数を入力する →
              </button>
            </div>
          )}

          {/* Step: scores */}
          {step === 'scores' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">試験名（任意）</label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder={examType}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="w-36">
                  <label className="block text-xs font-medium text-gray-600 mb-1">実施日</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">点数入力　<span className="font-normal text-gray-400">（得点 / 満点）</span></label>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2.5">
                  {selected.map((name) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-gray-700 font-medium truncate">{name}</span>
                      <input
                        type="number"
                        value={scoreInputs[name]?.score ?? ''}
                        onChange={(e) => updateInput(name, 'score', e.target.value)}
                        placeholder="得点"
                        min="0"
                        className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <span className="text-gray-400 text-xs">/</span>
                      <input
                        type="number"
                        value={scoreInputs[name]?.max ?? '100'}
                        onChange={(e) => updateInput(name, 'max', e.target.value)}
                        placeholder="満点"
                        min="1"
                        className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">メモ（任意）</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="感想・気づきなど"
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                onClick={handleSave}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700"
              >
                保存する
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── スコアカード ─────────────────────────────────────────
function ScoreCard({ entry, teacher, onDelete, onAnalysisUpdate }) {
  const [analyzing, setAnalyzing]     = useState(false)
  const [analysisError, setAnalysisError] = useState(null)
  const [showAnalysis, setShowAnalysis]   = useState(!!entry.aiAnalysis)

  const totalScore = entry.subjects.reduce((s, sub) => s + sub.score, 0)
  const totalMax   = entry.subjects.reduce((s, sub) => s + sub.max, 0)
  const totalPct   = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setAnalysisError(null)
    try {
      const lines = entry.subjects.map((s) => {
        const pct = Math.round((s.score / s.max) * 100)
        return `・${s.name}: ${s.score}/${s.max}点 (${pct}%)`
      }).join('\n')

      const prompt = `以下の模試結果について、簡潔に分析とアドバイスをしてください（200字以内）。

試験: ${entry.examName}（${entry.examType || ''}）
日付: ${entry.date}
結果:
${lines}
合計: ${totalScore}/${totalMax}点 (${totalPct}%)${entry.notes ? `\nメモ: ${entry.notes}` : ''}`

      const response = await callClaude({
        system: teacher?.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        model: HAIKU,
      })
      onAnalysisUpdate(entry.id, response)
      setShowAnalysis(true)
    } catch (err) {
      setAnalysisError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const pctColor = totalPct >= 80 ? 'text-emerald-600' : totalPct >= 60 ? 'text-amber-600' : 'text-red-500'

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-semibold text-gray-800">{entry.examName}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {entry.examType && <span className="mr-2">{entry.examType}</span>}
            {entry.date}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${pctColor}`}>{totalPct}%</p>
          <p className="text-xs text-gray-400">{totalScore}/{totalMax}点</p>
        </div>
      </div>

      <div className="space-y-1.5 my-3">
        {entry.subjects.map((s) => {
          const pct = s.max > 0 ? Math.round((s.score / s.max) * 100) : 0
          return (
            <div key={s.name} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 min-w-0 truncate" style={{ width: '9rem' }}>{s.name}</span>
              <PercentBar pct={pct} />
              <span className="text-xs text-gray-400 w-16 text-right shrink-0">{s.score}/{s.max}</span>
            </div>
          )
        })}
      </div>

      {entry.notes && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3 italic">{entry.notes}</p>
      )}

      {showAnalysis && entry.aiAnalysis && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-3">
          <p className="text-xs font-semibold text-indigo-700 mb-1">{teacher?.icon || '🎓'} {teacher?.name || '先生'}のコメント</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{entry.aiAnalysis}</p>
        </div>
      )}
      {analysisError && <p className="text-xs text-red-500 mb-2">{analysisError}</p>}

      <div className="flex gap-2">
        {!entry.aiAnalysis ? (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex-1 bg-indigo-50 text-indigo-700 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            {analyzing ? '分析中…' : '先生に分析してもらう'}
          </button>
        ) : (
          <button
            onClick={() => setShowAnalysis((v) => !v)}
            className="flex-1 bg-indigo-50 text-indigo-700 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            {showAnalysis ? 'コメントを閉じる' : '先生のコメントを見る'}
          </button>
        )}
        <button
          onClick={() => onDelete(entry.id)}
          className="px-3 py-2 text-xs text-red-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  )
}

// ── 推移グラフ ───────────────────────────────────────────
const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

function ScoreChart({ scores }) {
  const sorted = [...scores].sort((a, b) => a.date.localeCompare(b.date))
  const allSubjects = [...new Set(sorted.flatMap((e) => e.subjects.map((s) => s.name)))]

  const subjectData = allSubjects.map((subj) => ({
    name: subj,
    points: sorted
      .filter((e) => e.subjects.some((s) => s.name === subj))
      .map((e) => {
        const sub = e.subjects.find((s) => s.name === subj)
        return { date: e.date, pct: Math.round((sub.score / sub.max) * 100) }
      }),
  })).filter((s) => s.points.length > 0)

  const dates = [...new Set(sorted.map((e) => e.date))].sort()

  const W = 320, H = 170
  const PAD = { top: 12, right: 12, bottom: 28, left: 30 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom

  const xPos = (d) => dates.length === 1
    ? PAD.left + cW / 2
    : PAD.left + (dates.indexOf(d) / (dates.length - 1)) * cW
  const yPos = (pct) => PAD.top + cH - (Math.min(pct, 100) / 100) * cH

  return (
    <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm max-w-lg mx-auto">
      <p className="text-xs font-semibold text-gray-500 mb-2">得点率の推移（%）</p>
      <div className="overflow-x-auto">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={PAD.left} y1={yPos(v)} x2={PAD.left + cW} y2={yPos(v)} stroke="#f3f4f6" strokeWidth="1" />
              <text x={PAD.left - 4} y={yPos(v) + 4} textAnchor="end" fontSize="8" fill="#9ca3af">{v}</text>
            </g>
          ))}
          {dates.map((d) => (
            <text key={d} x={xPos(d)} y={H - 4} textAnchor="middle" fontSize="8" fill="#9ca3af">
              {d.slice(5)}
            </text>
          ))}
          {subjectData.slice(0, 7).map((subj, idx) => {
            const color = CHART_COLORS[idx % CHART_COLORS.length]
            const pts = subj.points
            if (pts.length === 1) {
              return <circle key={subj.name} cx={xPos(pts[0].date)} cy={yPos(pts[0].pct)} r={5} fill={color} />
            }
            const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(p.date)} ${yPos(p.pct)}`).join(' ')
            return (
              <g key={subj.name}>
                <path d={d} stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" />
                {pts.map((p) => (
                  <circle key={p.date} cx={xPos(p.date)} cy={yPos(p.pct)} r={3} fill={color} />
                ))}
              </g>
            )
          })}
        </svg>
      </div>
      {subjectData.length > 1 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
          {subjectData.slice(0, 7).map((subj, idx) => (
            <div key={subj.name} className="flex items-center gap-1">
              <div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
              <span className="text-xs text-gray-500">{subj.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── メインページ ─────────────────────────────────────────
const TAB_LABELS = { '定期テスト': '定期テスト', '記述模試': '記述模試', '共通テスト模試': '共通テスト' }

export default function ScoresPage() {
  const { get }                            = useStorage()
  const { getAll, add, remove, updateAnalysis } = useScores()
  const [showAdd, setShowAdd]              = useState(false)
  const [scores, setScores]               = useState(() => getAll())
  const [activeTab, setActiveTab]          = useState('定期テスト')

  const teacher = get('user:teacher')
  const filtered = scores.filter((s) => s.examType === activeTab)

  const handleAdd = (entry) => {
    add(entry)
    setScores(getAll())
    setShowAdd(false)
  }

  const handleDelete = (id) => {
    if (!window.confirm('この成績を削除しますか？')) return
    remove(id)
    setScores(getAll())
  }

  const handleAnalysisUpdate = (id, analysis) => {
    updateAnalysis(id, analysis)
    setScores(getAll())
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-800">成績管理</p>
          <p className="text-xs text-gray-400">模試・定期テストの結果を記録</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          + 追加
        </button>
      </div>

      {/* タブ */}
      <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
        {EXAM_TYPES.map((type) => {
          const count = scores.filter((s) => s.examType === type).length
          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === type
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {TAB_LABELS[type]}
              {count > 0 && <span className="ml-1 text-gray-400">({count})</span>}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {filtered.length >= 2 && <ScoreChart scores={filtered} />}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">📊</div>
            <p className="font-medium text-gray-600">{TAB_LABELS[activeTab]}の成績を記録しよう</p>
            <p className="text-sm text-gray-400 mt-1">「+ 追加」から入力できます</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
              最初の成績を追加
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-w-lg mx-auto">
            {filtered.map((entry) => (
              <ScoreCard
                key={entry.id}
                entry={entry}
                teacher={teacher}
                onDelete={handleDelete}
                onAnalysisUpdate={handleAnalysisUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddScoreModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
    </div>
  )
}
