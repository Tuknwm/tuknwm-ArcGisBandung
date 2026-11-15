import { useState, useEffect, useCallback, useRef } from 'react'
import { matches, CATEGORIES, formatRupiah } from '../lib/places'
import CategoryIcon from './CategoryIcon'
import { saw } from '../lib/saw'
import { computeWeights } from '../lib/weights'
import WeightEditor, { WeightPopout, WeightRows } from './WeightEditor'
import { useLang } from '../lib/LangContext'

function PlacePicker({ label, placeholder, slot, place, places, onPick, onClear, pickingSlot, onStartPick, t }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(-1)
  const isPickingThis = pickingSlot === slot

  const results = q.trim() ? places.filter((p) => matches(p, q)).slice(0, 6) : []

  function pick(p) { onPick(p); setQ(''); setOpen(false); setCursor(-1) }

  function handleKey(e) {
    if (!open || !results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && cursor >= 0) pick(results[cursor])
    if (e.key === 'Escape') { setOpen(false); setQ('') }
  }

  useEffect(() => { setCursor(-1) }, [q])

  if (place) {
    const cat = CATEGORIES[place.category]
    return (
      <div className="cpick cpick--filled">
        <span className="cpick-slot">{slot}</span>
        <CategoryIcon category={place.category} size={14} />
        <span className="cpick-name">{place.name}</span>
        <button className="cpick-clear" onClick={onClear} aria-label={t?.close ?? 'Close'}>×</button>
      </div>
    )
  }

  return (
    <div className={`cpick cpick--empty${isPickingThis ? ' cpick--picking' : ''}`}>
      <span className="cpick-slot">{slot}</span>
      <div className="cpick-search">
        <input
          type="search"
          placeholder={isPickingThis ? (t?.pickFromMap ?? 'Click a pin on the map…') : (placeholder ?? label)}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKey}
          autoComplete="off"
          readOnly={isPickingThis}
        />
        {open && results.length > 0 && !isPickingThis && (
          <ul className="cpick-list" role="listbox">
            {results.map((p, i) => (
              <li
                key={p.id}
                role="option"
                aria-selected={i === cursor}
                className={i === cursor ? 'is-active' : ''}
                onMouseDown={() => pick(p)}
              >
                <CategoryIcon category={p.category} size={13} />
                <span>{p.name}</span>
                <small>{p.kecamatan}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        className={`cpick-map-btn${isPickingThis ? ' is-active' : ''}`}
        title={isPickingThis ? (t?.cancelPickFromMap ?? 'Cancel pick from map') : (t?.pickFromMapBtn ?? 'Pick from map')}
        onClick={() => onStartPick(isPickingThis ? null : slot)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
        </svg>
      </button>
    </div>
  )
}

function Bar({ nA, nB }) {
  return (
    <div className="cbar-wrap">
      <div className="cbar" style={{ width: `${nA * 100}%` }} data-slot="a" />
      <div className="cbar" style={{ width: `${nB * 100}%` }} data-slot="b" />
    </div>
  )
}

export function CompareButton({ onClick, active, label }) {
  return (
    <button type="button" className={`compare-btn${active ? ' is-active' : ''}`} onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
      </svg>
      {label ?? 'Bandingkan Destinasi'}
    </button>
  )
}

export function CompareSidePanel({ hidden, places, onClose, pickingSlot, onStartPick, mapPickedPlace, onMapPickConsumed, isMobile }) {
  const { t } = useLang()
  const [placeA, setPlaceA] = useState(null)
  const [placeB, setPlaceB] = useState(null)
  const [manualW, setManualW] = useState({})
  const [closing, setClosing] = useState(false)
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

  useEffect(() => {
    if (!mapPickedPlace) return
    if (mapPickedPlace.slot === 'A') setPlaceA(mapPickedPlace.place)
    if (mapPickedPlace.slot === 'B') setPlaceB(mapPickedPlace.place)
    onMapPickConsumed()
  }, [mapPickedPlace, onMapPickConsumed])

  const manualTotal = Object.values(manualW).reduce((s, v) => s + v, 0)
  const isOver = manualTotal > 100
  const result = placeA && placeB && !isOver ? saw(placeA, placeB, computeWeights(manualW)) : null
  const winner = result ? (result.scoreA >= result.scoreB ? 'A' : 'B') : null

  const labelMap = { rating: t.sawRating, facility: t.sawFacility, access: t.sawAccess, distance: t.sawDistance, price: t.sawPrice }

  return (
    <>
    {isMobile && loaded && !hidden && priorityOpen && (
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
          <WeightEditor manualW={manualW} onManualW={setManualW} labelMap={labelMap} t={t} />
          <WeightRows manualW={manualW} onManualW={setManualW} labelMap={labelMap} t={t} />
        </div>
      </div>
    )}
    <aside
      ref={panelRef}
      className={`compare-panel${closing ? ' is-closing' : ''}`}
      aria-label="Bandingkan Destinasi"
      style={{
        ...(hidden ? { display: 'none' } : {}),
        ...(dragY > 0 || isDragging.current ? { transform: `translateY(${dragY}px)`, transition: isDragging.current ? 'none' : 'transform 0.4s cubic-bezier(0.32,0.72,0,1)' } : {}),
      }}
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
        <span className="compare-panel-title">{t.compareTitle}</span>
        <button type="button" className="icon-btn" onClick={handleClose} aria-label={t.close}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      {loaded && (
        <div className="compare-panel-body">
          <div className="cmodal-pickers">
            <span className="compare-vs">{t.comparePick}</span>
            <PlacePicker slot="A" label={t.destA} placeholder={t.typeDestA} place={placeA} places={places}
              onPick={setPlaceA} onClear={() => setPlaceA(null)}
              pickingSlot={pickingSlot} onStartPick={onStartPick} t={t} />
            <span className="compare-vs">{t.compareWith}</span>
            <PlacePicker slot="B" label={t.destB} placeholder={t.typeDestB} place={placeB} places={places}
              onPick={setPlaceB} onClear={() => setPlaceB(null)}
              pickingSlot={pickingSlot} onStartPick={onStartPick} t={t} />
          </div>

          {isMobile ? (
            <button className="mobile-priority-btn" onClick={openPriority}>
              <span>{t.sawPriorityLabel ?? 'Priority Criteria'}</span>
              {Object.keys(manualW).length > 0 && (
                <span className="mobile-priority-badge">{Object.keys(manualW).length}</span>
              )}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ) : (
            <WeightEditor manualW={manualW} onManualW={setManualW} labelMap={labelMap} t={t} />
          )}

          <p className="compare-result-label">{t.compareResult}</p>

          {isOver && (
            <p className="cpriority-over-warn">{t.sawOverWarn ?? 'Total bobot melebihi 100% — sesuaikan nilai.'}</p>
          )}

          {result && (
            <div className="compare-result">
              <div className="compare-scores">
                <div className={`cscore ${winner === 'A' ? 'cscore--win' : ''}`}>
                  <strong>{(result.scoreA * 100).toFixed(1)}</strong>
                  <span>{placeA.name}</span>
                </div>
                <div className="cscore-divider" />
                <div className={`cscore ${winner === 'B' ? 'cscore--win' : ''}`}>
                  <strong>{(result.scoreB * 100).toFixed(1)}</strong>
                  <span>{placeB.name}</span>
                </div>
              </div>

              <div className="csaw-legend">
                <span><span className="csaw-legend-bar csaw-legend-bar--a" />{t.sawLegendA}</span>
                <span><span className="csaw-legend-bar csaw-legend-bar--b" />{t.sawLegendB}</span>
                <span className="csaw-legend-hint">{t.sawLegendHint}</span>
              </div>
              <table className="csaw-table">
                <thead>
                  <tr>
                    <th>Kriteria</th>
                    <th>Bobot</th>
                    <th>A</th>
                    <th>B</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map(({ key, weight, valA, valB, nA, nB }) => {
                    const labelMap = { rating: t.sawRating, facility: t.sawFacility, access: t.sawAccess, distance: t.sawDistance, price: t.sawPrice }
                    return (
                    <tr key={key}>
                      <td>{labelMap[key]}</td>
                      <td>{(weight * 100).toFixed(0)}%</td>
                      <td className={nA > nB ? 'csaw-win' : ''}>
                        <span className="csaw-raw">{fmtVal(key, valA)}</span>
                        <Bar nA={nA} nB={nB} />
                      </td>
                      <td className={nB > nA ? 'csaw-win' : ''}>
                        <span className="csaw-raw">{fmtVal(key, valB)}</span>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <footer className="compare-panel-foot">
        <p className="cmodal-hint">{t.compareHint}</p>
      </footer>
    </aside>
    {!isMobile && (
      <WeightPopout manualW={manualW} onManualW={setManualW} labelMap={labelMap} t={t} anchorRef={panelRef} />
    )}
    </>
  )
}

function fmtVal(key, val) {
  if (key === 'price') return formatRupiah(val)
  if (key === 'distance') return `${val} km`
  if (key === 'rating') return val.toFixed(1)
  return `${val}/5`
}
