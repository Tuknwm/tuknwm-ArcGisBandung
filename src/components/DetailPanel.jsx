import { useState, useEffect } from 'react'
import { CATEGORIES, formatRupiah } from '../lib/places'
import { useLang } from '../lib/LangContext'
import CategoryIcon from './CategoryIcon'

function Meter({ label, value }) {
  return (
    <div className="meter">
      <div className="meter-head">
        <span>{label}</span>
        <strong>{value}/5</strong>
      </div>
      <div className="meter-track" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= value ? 'on' : ''} style={{ '--i': n }} />
        ))}
      </div>
    </div>
  )
}

function Stars({ value }) {
  return (
    <span className="stars" aria-label={`Rating ${value} dari 5`}>
      <span className="stars-fill" style={{ width: `${(value / 5) * 100}%` }}>★★★★★</span>
      <span className="stars-base">★★★★★</span>
    </span>
  )
}

export default function DetailPanel({ place, onClose }) {
  const { t } = useLang()
  const [closing, setClosing] = useState(false)
  useEffect(() => { setClosing(false) }, [place])
  if (!place) return null

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 320)
  }

  const cat = CATEGORIES[place.category]
  const highlights = place.info.split(';').map((s) => s.trim()).filter(Boolean)
  const route = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ', ' + place.address)}`

  return (
    <aside className={`detail${closing ? ' is-closing' : ''}`} key={place.id} aria-labelledby="detail-title" style={{ '--c': cat.color }}>
      <header className="detail-head">
        <button type="button" className="icon-btn" onClick={handleClose} aria-label={t.detailClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <div className="detail-body">
        <h2 id="detail-title">{place.name}</h2>
        <p className="detail-loc">{place.address}</p>

        <div className="detail-rating">
          <strong>{place.rating.toFixed(1)}</strong>
          <Stars value={place.rating} />
          <span className="tag">
            <CategoryIcon category={place.category} size={12} />
            {cat.label}
          </span>
        </div>

        <dl className="facts">
          <div>
            <dt>{t.detailTicket}</dt>
            <dd>{formatRupiah(place.price)}</dd>
          </div>
          <div>
            <dt>{t.detailFromSoreang}</dt>
            <dd>{place.distance.toLocaleString('id-ID')} km</dd>
          </div>
          <div>
            <dt>{t.detailDistrict}</dt>
            <dd>{place.kecamatan}</dd>
          </div>
          <div className="fact-wide">
            <dt>{t.detailCoord}</dt>
            <dd className="coord">{place.lng.toFixed(6)}, {place.lat.toFixed(6)}</dd>
          </div>
        </dl>

        <div className="meters">
          <Meter label={t.detailFacility} value={place.facility} />
          <Meter label={t.detailAccess} value={place.access} />
        </div>

        <h3>{t.detailAbout}</h3>
        <ul className="highlights">
          {highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>

        {place.sources.length > 0 && (
          <p className="sources">
            {t.detailSource}{' '}
            {place.sources.map((s, i) => (
              <a key={s} href={s} target="_blank" rel="noreferrer">
                [{i + 1}]
              </a>
            ))}
          </p>
        )}
      </div>

      <footer className="detail-foot">
        <a className="btn-primary" href={route} target="_blank" rel="noreferrer">
          {t.detailMaps}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </a>
      </footer>
    </aside>
  )
}
