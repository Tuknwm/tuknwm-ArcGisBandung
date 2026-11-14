import { useState, useEffect, useCallback } from 'react'
import { matches, CATEGORIES, formatRupiah } from '../lib/places'
import CategoryIcon from './CategoryIcon'
import { saw } from '../lib/saw'
import { computeWeights } from '../lib/weights'
import WeightEditor, { WeightPopout } from './WeightEditor'
import { useLang } from '../lib/LangContext'

function PlacePicker({ label, slot, place, places, onPick, onClear, pickingSlot, onStartPick }) {
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
        <button className="cpick-clear" onClick={onClear} aria-label="Hapus pilihan">×</button>
      </div>
    )
  }

  return (
    <div className={`cpick cpick--empty${isPickingThis ? ' cpick--picking' : ''}`}>
      <span className="cpick-slot">{slot}</span>
      <div className="cpick-search">
        <input
          type="search"
          placeholder={isPickingThis ? 'Klik titik di peta…' : `Ketik ${label}…`}
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
        title={isPickingThis ? 'Batalkan pilih dari peta' : 'Pilih dari peta'}
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

export function CompareSidePanel({ places, onClose, pickingSlot, onStartPick, mapPickedPlace, onMapPickConsumed }) {
  const { t } = useLang()
  const [placeA, setPlaceA] = useState(null)
  const [placeB, setPlaceB] = useState(null)
  const [manualW, setManualW] = useState({})
  const [closing, setClosing] = useState(false)

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 320)
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
    <WeightPopout manualW={manualW} onManualW={setManualW} labelMap={labelMap} t={t} />
    <aside className={`compare-panel${closing ? ' is-closing' : ''}`} aria-label="Bandingkan Destinasi">
      <div className="detail-grip" aria-hidden="true" />

      <header className="compare-panel-head">
        <span className="compare-panel-title">{t.compareTitle}</span>
        <button type="button" className="icon-btn" onClick={handleClose} aria-label="Tutup">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <div className="compare-panel-body">
        <div className="cmodal-pickers">
          <span className="compare-vs">{t.comparePick}</span>
          <PlacePicker slot="A" label="Destinasi A" place={placeA} places={places}
            onPick={setPlaceA} onClear={() => setPlaceA(null)}
            pickingSlot={pickingSlot} onStartPick={onStartPick} />
          <span className="compare-vs">{t.compareWith}</span>
          <PlacePicker slot="B" label="Destinasi B" place={placeB} places={places}
            onPick={setPlaceB} onClear={() => setPlaceB(null)}
            pickingSlot={pickingSlot} onStartPick={onStartPick} />
        </div>

        <WeightEditor manualW={manualW} onManualW={setManualW} labelMap={labelMap} t={t} />

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
      <footer className="compare-panel-foot">
        <p className="cmodal-hint">{t.compareHint}</p>
      </footer>
    </aside>
    </>
  )
}

function fmtVal(key, val) {
  if (key === 'price') return formatRupiah(val)
  if (key === 'distance') return `${val} km`
  if (key === 'rating') return val.toFixed(1)
  return `${val}/5`
}
