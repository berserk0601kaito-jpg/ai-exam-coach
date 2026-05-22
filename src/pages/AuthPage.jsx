import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [signupDone, setSignupDone] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else if (mode === 'signup') {
        await signUp(email, password)
        setSignupDone(true)
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        })
        if (error) throw error
        setResetDone(true)
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

  if (resetDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">メールを送りました</h2>
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-medium text-gray-700">{email}</span> にパスワード再設定のリンクを送りました。
          </p>
          <button
            onClick={() => { setResetDone(false); setMode('login') }}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700"
          >
            ログイン画面へ
          </button>
        </div>
      </div>
    )
  }

  if (signupDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">確認メールを送りました</h2>

          <div className="bg-indigo-50 rounded-xl p-4 mb-5 text-left space-y-2">
            <p className="text-sm font-semibold text-indigo-800">次の手順でログインできます：</p>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-indigo-500 font-bold shrink-0">①</span>
              <span><span className="font-medium">{email}</span> のメールを開く</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-indigo-500 font-bold shrink-0">②</span>
              <span>メール内の <span className="font-medium text-indigo-700">「Confirm email address」</span> ボタンを押す</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-indigo-500 font-bold shrink-0">③</span>
              <span>このページに戻ってログインする</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-5">
            メールが届かない場合は迷惑メールフォルダもご確認ください
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
            {mode === 'login' ? 'ログイン' : mode === 'signup' ? 'アカウント作成' : 'パスワード再設定'}
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
            {mode !== 'reset' && (
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
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? '処理中...' : mode === 'login' ? 'ログイン' : mode === 'signup' ? 'アカウント作成' : 'リセットメールを送る'}
            </button>
          </form>

          <div className="mt-4 text-center space-y-2">
            {mode === 'login' && (
              <p className="text-sm text-gray-400">
                <button
                  onClick={() => { setMode('reset'); setError(null) }}
                  className="hover:underline"
                >
                  パスワードを忘れた方はこちら
                </button>
              </p>
            )}
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
                {mode === 'reset' ? 'パスワードを思い出した方は' : 'すでにアカウントをお持ちの方は'}
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
