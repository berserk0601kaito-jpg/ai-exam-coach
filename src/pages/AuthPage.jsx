import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [signupDone, setSignupDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setSignupDone(true)
      }
    } catch (err) {
      const msg = err.message || 'エラーが発生しました'
      if (msg.includes('Invalid login credentials')) setError('メールアドレスまたはパスワードが間違っています')
      else if (msg.includes('User already registered')) setError('このメールアドレスは既に登録されています')
      else if (msg.includes('Password should be')) setError('パスワードは6文字以上にしてください')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (signupDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">確認メールを送りました</h2>
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-medium text-gray-700">{email}</span> に確認メールを送りました。
            メール内のリンクをクリックしてアカウントを有効化してください。
          </p>
          <button
            onClick={() => { setSignupDone(false); setMode('login') }}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700"
          >
            ログイン画面へ
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
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login' ? 'ログイン' : 'アカウント作成'}
          </p>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="6文字以上"
                minLength={6}
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
              {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウント作成'}
            </button>
          </form>

          <div className="mt-4 text-center">
            {mode === 'login' ? (
              <p className="text-sm text-gray-500">
                アカウントをお持ちでない方は
                <button
                  onClick={() => { setMode('signup'); setError(null) }}
                  className="text-indigo-600 font-medium ml-1 hover:underline"
                >
                  新規登録
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                すでにアカウントをお持ちの方は
                <button
                  onClick={() => { setMode('login'); setError(null) }}
                  className="text-indigo-600 font-medium ml-1 hover:underline"
                >
                  ログイン
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
