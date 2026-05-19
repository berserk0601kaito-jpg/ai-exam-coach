import { useStorage } from '../hooks/useStorage'
import { PLAN_LIMITS } from '../hooks/useUsage'

const PLANS = [
  {
    id: 'light',
    name: 'ライト',
    price: '1,280円/月',
    limit: PLAN_LIMITS.light,
    color: 'border-gray-300',
    badge: '',
  },
  {
    id: 'standard',
    name: 'スタンダード',
    price: '2,980円/月',
    limit: PLAN_LIMITS.standard,
    color: 'border-indigo-500 ring-2 ring-indigo-200',
    badge: 'おすすめ',
  },
]

const MESSAGES = {
  expired: {
    icon: '⏰',
    title: '無料トライアルが終了しました',
    desc: 'プランを選択してAI受験コーチを続けましょう',
  },
  deviceLimit: {
    icon: '🔒',
    title: 'この端末ではトライアル済みです',
    desc: '無料トライアルは1端末につき1回のみご利用いただけます。プランを選択してください。',
  },
}

export default function PlanSelectPage({ reason = 'expired', onSelect }) {
  const { set } = useStorage()
  const msg = MESSAGES[reason] ?? MESSAGES.expired

  const handleSelect = (planId) => {
    set('user:plan', planId)
    onSelect(planId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">{msg.icon}</div>
          <h1 className="text-xl font-bold text-gray-800">{msg.title}</h1>
          <p className="text-sm text-gray-500 mt-2">{msg.desc}</p>
        </div>

        <div className="space-y-3 mb-6">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => handleSelect(plan.id)}
              className={`w-full bg-white border-2 rounded-2xl p-5 text-left hover:shadow-md transition-all ${plan.color}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{plan.name}</span>
                    {plan.badge && (
                      <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">1日 {plan.limit} 回まで</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-indigo-700">{plan.price}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-center text-gray-400">
          ※ デモ版のため実際の課金は発生しません
        </p>
      </div>
    </div>
  )
}
