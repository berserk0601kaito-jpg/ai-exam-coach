import { useState } from 'react'

const GRADES = ['高1', '高2', '高3', '浪人']
const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
]
const SUBJECTS = ['英語', '数学', '国語', '理科', '社会']
const LEVELS = ['得意', '普通', '苦手']
const CONCERNS = ['勉強法', 'メンタル', '志望校', 'モチベーション']

const DEFAULT_SUBJECTS = Object.fromEntries(SUBJECTS.map((s) => [s, '普通']))

export default function SurveyForm({ initialData, onSubmit, submitLabel = '講師を決定する' }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    grade: initialData?.grade || '高3',
    targetSchool: initialData?.targetSchool || '',
    mbti: initialData?.mbti || '',
    subjects: initialData?.subjects || DEFAULT_SUBJECTS,
    concerns: initialData?.concerns || [],
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = '名前を入力してください'
    if (!form.targetSchool.trim()) e.targetSchool = '志望校を入力してください'
    if (!form.mbti) e.mbti = 'MBTIタイプを選択してください'
    if (form.concerns.length === 0) e.concerns = '悩みを1つ以上選択してください'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSubmit(form)
  }

  const toggleConcern = (c) => {
    setForm((prev) => ({
      ...prev,
      concerns: prev.concerns.includes(c)
        ? prev.concerns.filter((x) => x !== c)
        : [...prev.concerns, c],
    }))
    setErrors((e) => ({ ...e, concerns: undefined }))
  }

  const setSubject = (subject, level) => {
    setForm((prev) => ({ ...prev, subjects: { ...prev.subjects, [subject]: level } }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 名前 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: undefined })) }}
          placeholder="例：山田 太郎"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* 学年 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">学年</label>
        <div className="flex gap-2 flex-wrap">
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setForm((p) => ({ ...p, grade: g }))}
              className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                form.grade === g
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* 志望校 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">志望校</label>
        <input
          type="text"
          value={form.targetSchool}
          onChange={(e) => { setForm((p) => ({ ...p, targetSchool: e.target.value })); setErrors((p) => ({ ...p, targetSchool: undefined })) }}
          placeholder="例：東京大学 理科一類"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {errors.targetSchool && <p className="text-xs text-red-500 mt-1">{errors.targetSchool}</p>}
      </div>

      {/* MBTI */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">MBTIタイプ</label>
        <div className="grid grid-cols-4 gap-2">
          {MBTI_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setForm((p) => ({ ...p, mbti: t })); setErrors((p) => ({ ...p, mbti: undefined })) }}
              className={`py-2 rounded-xl text-sm border transition-colors font-mono ${
                form.mbti === t
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {errors.mbti && <p className="text-xs text-red-500 mt-1">{errors.mbti}</p>}
      </div>

      {/* 科目別 得意・不得意 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">科目別 得意・不得意</label>
        <div className="space-y-2 bg-gray-50 rounded-xl p-3">
          {SUBJECTS.map((subject) => (
            <div key={subject} className="flex items-center gap-3">
              <span className="w-12 text-sm text-gray-700 font-medium">{subject}</span>
              <div className="flex gap-2">
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSubject(subject, level)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      form.subjects[subject] === level
                        ? level === '得意'
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : level === '苦手'
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-gray-500 text-white border-gray-500'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 現在の悩み */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">現在の悩み（複数選択可）</label>
        <div className="flex gap-2 flex-wrap">
          {CONCERNS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleConcern(c)}
              className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                form.concerns.includes(c)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {errors.concerns && <p className="text-xs text-red-500 mt-1">{errors.concerns}</p>}
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  )
}
