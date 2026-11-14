const CRITERIA = [
  { key: 'rating',   label: 'Rating',        weight: 0.35, benefit: true  },
  { key: 'facility', label: 'Fasilitas',      weight: 0.25, benefit: true  },
  { key: 'access',   label: 'Aksesibilitas',  weight: 0.20, benefit: true  },
  { key: 'distance', label: 'Jarak',          weight: 0.10, benefit: false },
  { key: 'price',    label: 'Harga Tiket',    weight: 0.10, benefit: false },
]

function resolveWeights(customWeights) {
  if (!customWeights) return Object.fromEntries(CRITERIA.map(c => [c.key, c.weight]))
  return customWeights
}

function normPair(valA, valB, benefit) {
  if (benefit) {
    const mx = Math.max(valA, valB)
    return mx === 0 ? [1, 1] : [valA / mx, valB / mx]
  }
  const a = valA === 0 ? 0 : valA
  const b = valB === 0 ? 0 : valB
  if (a === 0 && b === 0) return [1, 1]
  if (a === 0) return [1, 0]
  if (b === 0) return [0, 1]
  const mn = Math.min(a, b)
  return [mn / a, mn / b]
}

export function saw(placeA, placeB, customWeights = null) {
  const weights = resolveWeights(customWeights)
  let scoreA = 0
  let scoreB = 0
  const breakdown = CRITERIA.map(({ key, label, benefit }) => {
    const weight = weights[key] ?? 0
    const [nA, nB] = normPair(placeA[key], placeB[key], benefit)
    scoreA += nA * weight
    scoreB += nB * weight
    return { key, label, weight, valA: placeA[key], valB: placeB[key], nA, nB }
  })
  return { scoreA, scoreB, breakdown }
}

export { CRITERIA }

export function rankAll(places, customWeights = null) {
  const weights = resolveWeights(customWeights)

  const mx = {}
  const mn = {}
  CRITERIA.forEach(({ key, benefit }) => {
    const vals = places.map((p) => p[key])
    if (benefit) {
      mx[key] = Math.max(...vals)
    } else {
      const nonZero = vals.filter((v) => v > 0)
      mn[key] = nonZero.length ? Math.min(...nonZero) : 0
    }
  })

  return places
    .map((p) => {
      let score = 0
      CRITERIA.forEach(({ key, benefit }) => {
        let n
        if (benefit) {
          n = mx[key] === 0 ? 1 : p[key] / mx[key]
        } else {
          if (p[key] === 0) n = 1
          else n = mn[key] === 0 ? 0 : mn[key] / p[key]
        }
        score += n * (weights[key] ?? 0)
      })
      return { place: p, score }
    })
    .sort((a, b) => b.score - a.score)
    .map((item, i) => ({ ...item, rank: i + 1 }))
}
