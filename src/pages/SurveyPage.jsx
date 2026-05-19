import { useState } from 'react'
import SurveyForm from '../components/SurveyForm'
import { useStorage } from '../hooks/useStorage'
import { callClaude, isMockMode } from '../lib/anthropic'
import { buildTeacherPrompt, appendHistoryNote } from '../lib/prompts'
import { markTrialUsedOnDevice } from '../lib/deviceId'
import { getJSTDateString } from '../lib/date'

function parseTeacherJSON(raw) {
  // 1. そのままパース
  try { return JSON.parse(raw.trim()) } catch {}
  // 2. ```json ... ``` を除去してパース
  const stripped = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
  try { return JSON.parse(stripped) } catch {}
  // 3. 最初の {...} を抽出してパース
  const match = stripped.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch {}
  }
  throw new Error('JSONの解析に失敗しました。再試行してください。')
}

export default function SurveyPage({ mode = 'initial', onComplete }) {
  const { get, set } = useStorage()
  const [step, setStep] = useState('form') // 'form' | 'generating' | 'error'
  const [genError, setGenError] = useState(null)
  const [rawDebug, setRawDebug] = useState(null)

  const initialData = mode !== 'initial' ? get('user:profile') : null

  const handleSubmit = async (formData) => {
    const profile = {
      ...formData,
      lastLoginDate: getJSTDateString(),
    }
    set('user:profile', profile)

    if (mode === 'updateProfile') {
      onComplete({ profile, teacher: get('user:teacher') })
      return
    }

    setStep('generating')
    setGenError(null)

    try {
      const prompt = buildTeacherPrompt(formData)
      const raw = await callClaude({
        system: 'あなたはJSONのみを返すAPIです。マークダウンのコードブロック（```）は絶対に使わず、生のJSONオブジェクトだけを返してください。',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 3000,
      })

      console.log('API raw response:', raw)
      setRawDebug(raw)
      const teacher = parseTeacherJSON(raw)

      const hasHistory = (get('user:history') || []).length > 0
      if (hasHistory && mode === 'changeTeacher') {
        teacher.systemPrompt = appendHistoryNote(teacher.systemPrompt)
      }

      set('user:teacher', teacher)

      if (mode === 'initial') {
        const today = getJSTDateString()
        set('user:plan', 'trial')
        set('user:trialStart', today)
        set('user:usage', { date: today, count: 0 })
        set('user:history', [])
        markTrialUsedOnDevice() // この端末でのトライアル使用を記録
      }

      onComplete({ profile, teacher })
    } catch (err) {
      setGenError(err.message)
      setStep('error')
      console.error('Teacher gen error:', err)
    }
  }

  const titleMap = {
    initial: 'はじめに教えてください',
    changeTeacher: '新しい講師を選ぶ',
    updateProfile: 'プロフィールを更新',
  }

  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">あなたにぴったりの講師を探しています…</p>
          <p className="text-sm text-gray-400 mt-1">少々お待ちください</p>
          {isMockMode() && (
            <span className="inline-block mt-3 text-xs bg-amber-100 text-amber-700 border border-amber-300 px-3 py-1 rounded-full">
              モックモード（ダミーデータを使用中）
            </span>
          )}
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          <div className="text-4xl mb-4">😢</div>
          <p className="text-gray-700 font-medium mb-2">講師の生成に失敗しました</p>
          <p className="text-sm text-red-500 mb-4">{genError}</p>
          {rawDebug && (
            <div className="text-left bg-gray-100 rounded-lg p-3 mb-4 overflow-auto max-h-40">
              <p className="text-xs text-gray-500 mb-1">APIレスポンス（デバッグ）:</p>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">{rawDebug}</pre>
            </div>
          )}
          {!rawDebug && (
            <p className="text-xs text-orange-500 mb-4">※ APIレスポンスなし（モックモードまたはネットワークエラー）</p>
          )}
          <button
            onClick={() => setStep('form')}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700"
          >
            再試行する
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold text-gray-800">AI受験コーチ</h1>
          <p className="text-sm text-gray-500 mt-1">{titleMap[mode]}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <SurveyForm
            initialData={initialData}
            onSubmit={handleSubmit}
            submitLabel={mode === 'updateProfile' ? '保存する' : '講師を決定する'}
          />
        </div>
      </div>
    </div>
  )
}
