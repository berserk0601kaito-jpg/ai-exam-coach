// 日本時間（JST = UTC+9）の日付文字列を返す
export function getJSTDateString() {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}
