export default function TeacherCard({ teacher }) {
  if (!teacher) return null

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-3xl mx-auto mb-2">
        {teacher.icon}
      </div>
      <p className="font-semibold text-gray-800 text-sm">{teacher.name}</p>
      <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
        {teacher.mbti}
      </span>
      <p className="text-xs text-gray-500 mt-1 leading-snug">{teacher.style}</p>
    </div>
  )
}
