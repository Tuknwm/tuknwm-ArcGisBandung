import { WEIGHT_KEYS, autoPercent } from '../lib/weights'

export const ICONS = {
  rating:   <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  facility: <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  access:   <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  distance: <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>,
  price:    <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
}

export default function WeightEditor({ manualW, onManualW, labelMap, t, extraClass }) {
  function toggle(key) {
    const next = { ...manualW }
    if (key in next) { delete next[key] }
    else { next[key] = autoPercent(key, manualW) }
    onManualW(next)
  }

  return (
    <div className={`cpriority${extraClass ? ' ' + extraClass : ''}`}>
      <p className="cpriority-label">{t.sawPriorityLabel}</p>
      <div className="cpriority-chips">
        {WEIGHT_KEYS.map(key => (
          <button
            key={key}
            type="button"
            className={`cpriority-chip${key in manualW ? ' is-active' : ''}`}
            onClick={() => toggle(key)}
            aria-pressed={key in manualW}
          >
            {ICONS[key]}
            {labelMap[key]}
          </button>
        ))}
      </div>
    </div>
  )
}

export function WeightPopout({ manualW, onManualW, labelMap, t }) {
  const hasManual = Object.keys(manualW).length > 0
  if (!hasManual) return null

  const manualTotal = WEIGHT_KEYS.reduce((s, k) => s + (manualW[k] ?? 0), 0)
  const remaining   = Math.max(0, 100 - manualTotal)
  const isOver      = manualTotal > 100

  function toggle(key) {
    const next = { ...manualW }
    if (key in next) { delete next[key] }
    else { next[key] = autoPercent(key, manualW) }
    onManualW(next)
  }

  function setVal(key, raw) {
    const num = Math.min(99, Math.max(1, parseInt(raw) || 1))
    onManualW({ ...manualW, [key]: num })
  }

  return (
    <div className="weight-popout">
      <div className="weight-popout-head">
        <span>{t.sawPriorityLabel}</span>
        <button
          type="button"
          className="weight-popout-close"
          onClick={() => onManualW({})}
          aria-label="Reset bobot"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="cpriority-rows">
        {WEIGHT_KEYS.map(key => {
          const isManual = key in manualW
          const pct = isManual ? manualW[key] : autoPercent(key, manualW)
          return (
            <div key={key} className={`cpriority-row${isManual ? ' cpriority-row--manual' : ''}`}>
              <span className="cpriority-row-label">
                {ICONS[key]}
                {labelMap[key]}
              </span>
              <div className="cpriority-row-right">
                {isManual ? (
                  <div className="cpriority-input-wrap">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={manualW[key]}
                      onFocus={e => e.target.select()}
                      onChange={e => setVal(key, e.target.value)}
                    />
                    <span>%</span>
                  </div>
                ) : (
                  <span className="cpriority-auto-val">{pct}%</span>
                )}
                <div className="cpriority-bar-track">
                  <div
                    className={`cpriority-bar-fill${isManual ? ' cpriority-bar-fill--manual' : ''}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
        <div className={`cpriority-total${isOver ? ' cpriority-total--over' : ''}`}>
          <span>Manual: <strong>{manualTotal}%</strong></span>
          <span>Auto: <strong>{remaining}%</strong></span>
          <span>Total: <strong>100%</strong></span>
        </div>
      </div>
    </div>
  )
}
