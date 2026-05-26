import { useStorage } from '../hooks/useStorage'

export default function SettingsPage({ onChangeTeacher, onUpdateProfile, onBack }) {
  const { get } = useStorage()

  const profile = get('user:profile') || {}
  const teacher = get('user:teacher')
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

          {/* 会話履歴 */}
          <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">会話履歴</h2>
            <p className="text-sm text-gray-700">
              保存済みメッセージ数：<span className="font-medium">{historyCount} 件</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
