export const DEFAULT_W = { rating: 35, facility: 25, access: 20, distance: 10, price: 10 }
export const WEIGHT_KEYS = ['rating', 'facility', 'access', 'distance', 'price']

export function computeWeights(manualW = {}) {
  if (Object.keys(manualW).length === 0) {
    return Object.fromEntries(WEIGHT_KEYS.map(k => [k, DEFAULT_W[k] / 100]))
  }

  const manualTotal = WEIGHT_KEYS.reduce((s, k) => s + (manualW[k] ?? 0), 0)
  const remaining   = Math.max(0, 100 - manualTotal)
  const autoKeys    = WEIGHT_KEYS.filter(k => !(k in manualW))
  const autoDefault = autoKeys.reduce((s, k) => s + DEFAULT_W[k], 0)

  const result = {}
  WEIGHT_KEYS.forEach(k => {
    if (k in manualW) {
      result[k] = (manualW[k] ?? 0) / 100
    } else {
      result[k] = autoDefault > 0
        ? (DEFAULT_W[k] / autoDefault) * remaining / 100
        : remaining / (autoKeys.length * 100 || 1)
    }
  })
  return result
}

export function autoPercent(key, manualW) {
  const w = computeWeights(manualW)
  return Math.round(w[key] * 100)
}
