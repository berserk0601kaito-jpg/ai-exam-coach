import { useStorage } from '../hooks/useStorage'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured } from '../lib/supabase'
import { PLAN_LIMITS } from '../hooks/useUsage'

const PLAN_LABELS = {
  trial: '無料トライアル',
  light: 'ライト（1,280円/月）',
  standard: 'スタンダード（2,980円/月）',
}

export default function SettingsPage({ onChangeTeacher, onUpdateProfile, onBack, onLogout }) {
  const { get, remove } = useStorage()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    if (!window.confirm('ログアウトしますか？')) return
    if (isSupabaseConfigured()) await signOut().catch(() => {})
    onLogout?.()
  }
  const profile = get('user:profile') || {}
  const teacher = get('user:teacher')
  const plan = get('user:plan') || 'trial'
  const trialStart = get('user:trialStart')

  const today = new Date().toISOString().split('T')[0]
  const trialDaysLeft = trialStart
    ? Math.max(0, 7 - Math.floor((new Date(today) - new Date(trialStart)) / 86400000))
    : 0

  const historyCount = (get('user:history') || []).length

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
            >
              ←
            </button>
            <h1 className="text-lg font-bold text-gray-800">設定</h1>
          </div>

          {/* 現在の講師 */}
          <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">現在の講師</h2>
            {teacher ? (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
                  {teacher.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{teacher.name}</p>
                  <p className="text-xs text-gray-500">{teacher.mbti} · {teacher.style}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">講師が設定されていません</p>
            )}
            <button
              onClick={onChangeTeacher}
              className="w-full border border-indigo-300 text-indigo-600 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors"
            >
              講師を変える
            </button>
          </section>

          {/* プロフィール */}
          <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">プロフィール</h2>
            <div className="space-y-1.5 mb-4 text-sm text-gray-700">
              <p><span className="text-gray-400">名前：</span>{profile.name}</p>
              <p><span className="text-gray-400">学年：</span>{profile.grade}</p>
              <p><span className="text-gray-400">志望校：</span>{profile.targetSchool}</p>
              <p><span className="text-gray-400">MBTI：</span>{profile.mbti}</p>
            </div>
            <button
              onClick={onUpdateProfile}
              className="w-full border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              アンケートを修正
            </button>
          </section>

          {/* プラン情報 */}
          <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">プラン</h2>
            <p className="text-sm text-gray-700 mb-1">
              現在のプラン：<span className="font-medium">{PLAN_LABELS[plan]}</span>
            </p>
            <p className="text-sm text-gray-500">
              1日の上限：<span className="font-medium">{PLAN_LIMITS[plan]} 回</span>
            </p>
            {plan === 'trial' && (
              <p className="text-sm text-indigo-600 mt-1">
                トライアル残り <span className="font-bold">{trialDaysLeft}</span> 日
              </p>
            )}
          </section>

          {/* 会話履歴 */}
          <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">会話履歴</h2>
            <p className="text-sm text-gray-700">
              保存済みメッセージ数：<span className="font-medium">{historyCount} 件</span>
            </p>
          </section>

          {/* ログアウト */}
          {isSupabaseConfigured() && (
            <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <button
                onClick={handleLogout}
                className="w-full border border-red-200 text-red-500 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
              >
                ログアウト
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
