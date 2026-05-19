import { useState, useRef } from 'react'

export default function MessageInput({ onSend, onRetry, isLoading, error, remainingCount }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setText('')
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const showRetry = error?.type === 'api'
  const showLimit = error?.type === 'limit'

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      {showLimit && (
        <p className="text-sm text-red-500 text-center mb-2">{error.message}</p>
      )}
      {showRetry && (
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm text-red-500 flex-1">送信に失敗しました: {error.message}</p>
          <button
            onClick={onRetry}
            disabled={isLoading}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-300 rounded-lg px-3 py-1 hover:bg-indigo-50 disabled:opacity-50"
          >
            リトライ
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || showLimit}
          placeholder={showLimit ? '本日の上限に達しました' : 'メッセージを入力… (Enter で送信)'}
          rows={1}
          className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed max-h-32 overflow-y-auto"
          style={{ lineHeight: '1.5' }}
          onInput={(e) => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading || showLimit}
          className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
          </svg>
        </button>
      </div>
      {typeof remainingCount === 'number' && !showLimit && (
        <p className="text-xs text-gray-400 mt-1.5 text-right">今日あと {remainingCount} 回話せます</p>
      )}
    </div>
  )
}
