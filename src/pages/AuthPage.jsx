import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">メールを送りました</h2>
          <div className="bg-indigo-50 rounded-xl p-4 mb-5 text-left space-y-2">
            <p className="text-sm font-semibold text-indigo-800">次の手順でログインできます：</p>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-indigo-500 font-bold shrink-0">①</span>
              <span><span className="font-medium">{email}</span> のメールを開く</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-indigo-500 font-bold shrink-0">②</span>
              <span>メール内の <span className="font-medium text-indigo-700">「Log In」</span> ボタンを押す</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-indigo-500 font-bold shrink-0">③</span>
              <span>自動的にログインされます</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            メールが届かない場合は迷惑メールフォルダもご確認ください
          </p>
          <button
            onClick={() => setSent(false)}
            className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50"
          >
            メールアドレスを変更する
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold text-gray-800">AI受験コーチ</h1>
          <p className="text-sm text-gray-500 mt-1">メールアドレスでログイン・登録</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? '送信中...' : 'ログインリンクを送る'}
            </button>
          </form>

          <p className="text-xs text-center text-gray-400 mt-4">
            初めての方もこのままご利用いただけます
          </p>
        </div>
      </div>
    </div>
  )
}
