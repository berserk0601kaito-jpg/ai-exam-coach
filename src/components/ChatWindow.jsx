import { useEffect, useRef } from 'react'
import ChatBubble from './ChatBubble'
import LoadingDots from './LoadingDots'

export default function ChatWindow({ messages, isLoading, teacherIcon }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
      {messages.map((msg, i) => (
        <ChatBubble key={i} message={msg} teacherIcon={teacherIcon} />
      ))}
      {isLoading && (
        <div className="flex items-end gap-2 justify-start">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-lg flex-shrink-0">
            {teacherIcon || '🎓'}
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm">
            <LoadingDots />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
