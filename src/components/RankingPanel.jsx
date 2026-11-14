import { useState, useMemo } from 'react'
import { CATEGORIES, places as allPlaces } from '../lib/places'
import CategoryIcon from './CategoryIcon'
import { rankAll } from '../lib/saw'
import { computeWeights } from '../lib/weights'
import WeightEditor, { WeightPopout } from './WeightEditor'
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

export function RankingPanel({ onClose, onSelect }) {
  const { t } = useLang()
  const [closing, setClosing] = useState(false)
  const [manualW, setManualW] = useState({})

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 320)
  }

  const manualTotal = Object.values(manualW).reduce((s, v) => s + v, 0)
  const isOver = manualTotal > 100
  const ranked = useMemo(() => isOver ? [] : rankAll(allPlaces, computeWeights(manualW)), [manualW, isOver])
  const top10 = ranked.slice(0, 10)
  const rest  = ranked.slice(10)
  const labelMap = { rating: t.sawRating, facility: t.sawFacility, access: t.sawAccess, distance: t.sawDistance, price: t.sawPrice }

  return (
    <>
    <WeightPopout manualW={manualW} onManualW={setManualW} labelMap={labelMap} t={t} />
    <aside className={`compare-panel${closing ? ' is-closing' : ''}`} aria-label="Peringkat Destinasi">
      <div className="detail-grip" aria-hidden="true" />

      <header className="compare-panel-head">
        <span className="compare-panel-title">{t.rankTitle1}<br/>{t.rankTitle2}</span>
        <button type="button" className="icon-btn" onClick={handleClose} aria-label="Tutup">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <div className="rank-body">
        <WeightEditor manualW={manualW} onManualW={setManualW} labelMap={labelMap} t={t} extraClass="cpriority--rank" />

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

      <footer className="compare-panel-foot">
        <p className="cmodal-hint">{t.rankHint}</p>
      </footer>
    </aside>
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
