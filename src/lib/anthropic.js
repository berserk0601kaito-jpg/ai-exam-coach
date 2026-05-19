export const SONNET = 'claude-sonnet-4-6'
export const HAIKU = 'claude-haiku-4-5-20251001'

export function isMockMode() {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY
  const proxyVal = import.meta.env.VITE_USE_PROXY
  const useProxy = proxyVal === 'true' || proxyVal === 'True' || proxyVal === '1'
  return !useProxy && (!key || key === 'your_api_key_here')
}

// ------- モックデータ -------

const MOCK_TEACHER = {
  name: '田中 誠',
  mbti: 'ENFJ',
  icon: '🌟',
  style: '共感重視・温かい口調',
  intro: '一緒に志望校合格を目指そう！',
  systemPrompt: `あなたは田中誠という大学受験コーチです。温かく共感力の高いENFJタイプの講師として、生徒に寄り添いながら的確なアドバイスを行います。大学受験に特化した面談のみを担当してください。`,
}

const MOCK_CHAT_RESPONSES = [
  (profile) =>
    `こんにちは！${profile?.name || 'あなた'}さんの担当講師、田中です。\n今日はどんなことを一緒に考えましょうか？勉強のこと、志望校のこと、なんでも話してください！`,
  'いい質問ですね。まず基礎をしっかり固めることが大切です。焦らず一歩ずつ進みましょう！',
  '模試の結果は目標への道しるべです。できなかった問題こそ、伸びしろだと思ってください。',
  'その取り組み方、すごくいいと思います！継続することが一番の近道ですよ。',
  '志望校の傾向を把握することがとても重要です。過去問は早めに目を通しておきましょう。',
  'メンタルが辛い時期もありますよね。そういう時こそ、小さな目標を立てて達成感を積み重ねましょう。',
  'その科目が苦手なのはよくわかります。まずどこでつまずいているか一緒に特定しましょう！',
]

let mockResponseIndex = 1

async function mockCallClaude({ system, messages }) {
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600))

  // system がない、またはJSON専用プロンプト → 講師生成
  if (!system || system.includes('JSONのみ')) {
    // メッセージ内容からプロフィール情報を抽出して講師名をカスタマイズ
    const content = messages[0]?.content || ''
    const nameMatch = content.match(/名前：(.+)/)
    const name = nameMatch?.[1]?.trim() || ''
    const teacher = { ...MOCK_TEACHER }
    if (name) {
      teacher.systemPrompt = teacher.systemPrompt + `\n生徒の名前は${name}さんです。`
    }
    return JSON.stringify(teacher)
  }

  // system がある → チャット返答
  const profile = (() => {
    const m = system.match(/生徒の名前は(.+?)さん/)
    return m ? { name: m[1] } : null
  })()

  const isFirst = messages.length === 1 || messages[0]?.content?.includes('初回セッション')
  if (isFirst) return MOCK_CHAT_RESPONSES[0](profile)

  const response = MOCK_CHAT_RESPONSES[mockResponseIndex % MOCK_CHAT_RESPONSES.length]
  mockResponseIndex++
  return typeof response === 'function' ? response(profile) : response
}

// ------- 本番APIコール -------

export async function callClaude({ system, messages, maxTokens = 1000, model = SONNET }) {
  if (isMockMode()) return mockCallClaude({ system, messages })

  const body = { model, max_tokens: maxTokens, messages }
  if (system) body.system = system

  const useProxy = ['true', 'True', '1'].includes(import.meta.env.VITE_USE_PROXY)

  const url = useProxy ? '/api/claude' : 'https://api.anthropic.com/v1/messages'
  const headers = useProxy
    ? { 'Content-Type': 'application/json' }
    : {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `APIエラー: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}
