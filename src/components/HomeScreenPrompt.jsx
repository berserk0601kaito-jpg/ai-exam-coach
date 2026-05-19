import { useState, useEffect } from 'react'

const STORAGE_KEY = 'homescreen_prompt_dismissed'

export default function HomeScreenPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // すでに表示済みなら出さない
    if (localStorage.getItem(STORAGE_KEY)) return
    // スタンドアロンモード（すでにホーム画面追加済み）なら出さない
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // 少し遅らせて表示
    const t = setTimeout(() => setShow(true), 1500)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4" onClick={dismiss}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">📱</div>
          <h2 className="text-lg font-bold text-gray-800">ホーム画面に追加しよう</h2>
          <p className="text-sm text-gray-500 mt-1">アプリのように使えます</p>
        </div>

        {isIOS ? (
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-indigo-500 font-bold shrink-0">①</span>
              <span>画面下部の <span className="font-medium">「共有」ボタン</span>（↑アイコン）をタップ</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-indigo-500 font-bold shrink-0">②</span>
              <span><span className="font-medium">「ホーム画面に追加」</span> を選択</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-indigo-500 font-bold shrink-0">③</span>
              <span><span className="font-medium">「追加」</span> をタップして完了！</span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-indigo-500 font-bold shrink-0">①</span>
              <span>右上の <span className="font-medium">「⋮」メニュー</span> をタップ</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-indigo-500 font-bold shrink-0">②</span>
              <span><span className="font-medium">「ホーム画面に追加」</span> を選択</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-indigo-500 font-bold shrink-0">③</span>
              <span><span className="font-medium">「追加」</span> をタップして完了！</span>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <button
            onClick={dismiss}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700"
          >
            わかった！
          </button>
          <button
            onClick={dismiss}
            className="w-full text-gray-400 text-sm py-1"
          >
            今はしない
          </button>
        </div>
      </div>
    </div>
  )
}
