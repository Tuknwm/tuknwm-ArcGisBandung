import { useState, useMemo, useRef, useEffect } from 'react'
import { CATEGORIES, places as allPlaces } from '../lib/places'
import CategoryIcon from './CategoryIcon'
import { rankAll } from '../lib/saw'
import { computeWeights } from '../lib/weights'
import WeightEditor, { WeightPopout, WeightRows } from './WeightEditor'
import { useLang } from '../lib/LangContext'

export function RankingButton({ onClick, active, label }) {
  return (
    <button type="button" className={`compare-btn${active ? ' is-active' : ''}`} onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
      {label ?? 'Peringkat Destinasi'}
    </button>
  )
}

export function RankingPanel({ onClose, onSelect, isMobile }) {
  const { t } = useLang()
  const [closing, setClosing] = useState(false)
  const [manualW, setManualW] = useState({})
  const [dragY, setDragY] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)
  const [priorityClosing, setPriorityClosing] = useState(false)
  const [priorityDragY, setPriorityDragY] = useState(0)
  const isDragging = useRef(false)
  const touchStartY = useRef(0)
  const priorityIsDragging = useRef(false)
  const priorityTouchStartY = useRef(0)
  const panelRef = useRef(null)

  function openPriority() { setPriorityOpen(true); setPriorityClosing(false); setPriorityDragY(0) }
  function closePriority() {
    setPriorityClosing(true)
    setPriorityDragY(0)
    setTimeout(() => { setPriorityOpen(false); setPriorityClosing(false) }, 360)
  }
  function handlePriorityTouchStart(e) {
    priorityTouchStartY.current = e.touches[0].clientY
    priorityIsDragging.current = true
  }
  function handlePriorityTouchMove(e) {
    const delta = e.touches[0].clientY - priorityTouchStartY.current
    if (delta > 0) { setPriorityDragY(delta); e.preventDefault() }
  }
  function handlePriorityTouchEnd() {
    priorityIsDragging.current = false
    if (priorityDragY > 80) closePriority()
    else setPriorityDragY(0)
  }

  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function handleClose() {
    if (closing) return
    setClosing(true)
    setTimeout(onClose, 360)
  }

  function handleTouchStart(e) {
    touchStartY.current = e.touches[0].clientY
    isDragging.current = true
  }
  function handleTouchMove(e) {
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) { setDragY(delta); e.preventDefault() }
  }
  function handleTouchEnd() {
    isDragging.current = false
    if (dragY > 80) handleClose()
    else setDragY(0)
  }

  const manualTotal = Object.values(manualW).reduce((s, v) => s + v, 0)
  const isOver = manualTotal > 100
  const ranked = useMemo(() => isOver ? [] : rankAll(allPlaces, computeWeights(manualW)), [manualW, isOver])
  const top10 = ranked.slice(0, 10)
  const rest  = ranked.slice(10)
  const labelMap = { rating: t.sawRating, facility: t.sawFacility, access: t.sawAccess, distance: t.sawDistance, price: t.sawPrice }

  return (
    <>
    {isMobile && loaded && priorityOpen && (
      <div
        className={`mobile-priority-sheet${priorityClosing ? ' is-closing' : ''}`}
        style={priorityDragY > 0 || priorityIsDragging.current ? { transform: `translateY(${priorityDragY}px)`, transition: priorityIsDragging.current ? 'none' : 'transform 0.4s cubic-bezier(0.32,0.72,0,1)' } : undefined}
      >
        <div
          className="mobile-sheet-grip"
          onTouchStart={handlePriorityTouchStart}
          onTouchMove={handlePriorityTouchMove}
          onTouchEnd={handlePriorityTouchEnd}
          onTouchCancel={handlePriorityTouchEnd}
          style={{ touchAction: 'none', cursor: 'grab' }}
        />
        <div className="mobile-sheet-head">
          <span className="mobile-sheet-title">{t.sawPriorityLabel ?? 'Priority Criteria'}</span>
          <button className="icon-btn" onClick={closePriority} aria-label={t.close}>
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="mobile-priority-body">
          <WeightEditor manualW={manualW} onManualW={setManualW} labelMap={labelMap} t={t} extraClass="cpriority--rank" />
          <WeightRows manualW={manualW} onManualW={setManualW} labelMap={labelMap} t={t} />
        </div>
      </div>
    )}
    <aside
      ref={panelRef}
      className={`compare-panel${closing ? ' is-closing' : ''}`}
      aria-label="Peringkat Destinasi"
      style={dragY > 0 || isDragging.current ? { transform: `translateY(${dragY}px)`, transition: isDragging.current ? 'none' : 'transform 0.4s cubic-bezier(0.32,0.72,0,1)' } : undefined}
    >
      <div
        className="detail-grip"
        aria-hidden="true"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ touchAction: 'none', cursor: 'grab' }}
      />

      <header className="compare-panel-head">
        <span className="compare-panel-title">{t.rankTitle1}<br/>{t.rankTitle2}</span>
        <button type="button" className="icon-btn" onClick={handleClose} aria-label={t.close}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      {loaded && (
        <div className="rank-body">
          {isMobile ? (
            <button className="mobile-priority-btn" onClick={openPriority}>
              <span>{t.sawPriorityLabel ?? 'Priority Criteria'}</span>
              {Object.keys(manualW).length > 0 && (
                <span className="mobile-priority-badge">{Object.keys(manualW).length}</span>
              )}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ) : (
            <WeightEditor manualW={manualW} onManualW={setManualW} labelMap={labelMap} t={t} extraClass="cpriority--rank" />
          )}

          {isOver && (
            <p className="cpriority-over-warn">{t.sawOverWarn ?? 'Total bobot melebihi 100% — sesuaikan nilai.'}</p>
          )}

          <ul className="rank-list">
            {top10.map(({ place, score, rank }) => (
              <RankItem key={place.id} place={place} score={score} rank={rank} top onSelect={onSelect} />
            ))}
          </ul>

          <p className="rank-rest-label">{t.rankRest}</p>
          <ul className="rank-list rank-list--rest">
            {rest.map(({ place, score, rank }) => (
              <RankItem key={place.id} place={place} score={score} rank={rank} onSelect={onSelect} />
            ))}
          </ul>
        </div>
      )}

      <footer className="compare-panel-foot">
        <p className="cmodal-hint">{t.rankHint}</p>
      </footer>
    </aside>
    {!isMobile && (
      <WeightPopout manualW={manualW} onManualW={setManualW} labelMap={labelMap} t={t} anchorRef={panelRef} />
    )}
    </>
  )
}

function RankItem({ place, score, rank, top, onSelect }) {
  return (
    <li className={`rank-item${top ? ' rank-item--top' : ''}`} onClick={() => onSelect(place.id)}>
      <span className="rank-num">{rank}</span>
      <CategoryIcon category={place.category} size={15} />
      <span className="rank-info">
        <strong>{place.name}</strong>
        <small>{place.kecamatan} · {CATEGORIES[place.category].label}</small>
      </span>
      <span className="rank-score">{(score * 100).toFixed(1)}</span>
    </li>
  )
}
