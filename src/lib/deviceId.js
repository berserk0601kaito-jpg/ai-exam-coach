// ブラウザ・ハードウェア特性から端末固有のフィンガープリントを生成する。
// ストレージに依存しないため、同一ブラウザプロファイル内では常に同じ値になる。
// ただし localStorage に紐付けるため、ストレージクリアや別ブラウザでは同一視できない（既知の限界）。

function fnv1a(str) {
  let h = 0x811c9dc5 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}

export function getDeviceFingerprint() {
  const parts = [
    navigator.platform,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    navigator.hardwareConcurrency ?? 0,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.maxTouchPoints ?? 0,
  ]
  return fnv1a(parts.join('::'))
}

const trialKey = () => `_t_${getDeviceFingerprint()}`

export function isTrialUsedOnDevice() {
  return localStorage.getItem(trialKey()) === '1'
}

export function markTrialUsedOnDevice() {
  localStorage.setItem(trialKey(), '1')
}
