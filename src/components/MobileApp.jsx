import { useCallback, useDeferredValue, useMemo, useState, useRef } from 'react'
import MapView from './MapView'
import SplashScreen from './SplashScreen'
import CategoryIcon from './CategoryIcon'
import DetailPanel from './DetailPanel'
import { CompareSidePanel } from './ComparePanel'
import { RankingPanel } from './RankingPanel'
import { CATEGORIES, boundary, matches, places } from '../lib/places'
import { useLang } from '../lib/LangContext'
import WeatherWidget from './WeatherWidget'
import './MobileApp.css'

const SPLASH_SESSION_KEY = 'splashSeen:v4'

export default function MobileApp() {
  const { t, lang, setLang } = useLang()
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [activeCats, setActiveCats] = useState(() => new Set(Object.keys(CATEGORIES)))
  const [selectedId, setSelectedId] = useState(null)
  const [activeSheet, setActiveSheet] = useState(null)
  const [pickingSlot, setPickingSlot] = useState(null)
  const [mapPickedPlace, setMapPickedPlace] = useState(null)
  const [resetSignal, setResetSignal] = useState(0)
  const [infoClosing, setInfoClosing] = useState(false)
  const [infoDragY, setInfoDragY] = useState(0)
  const infoTouchStartY = useRef(0)
  const infoIsDragging = useRef(false)
  const [splashAlreadySeen] = useState(() => sessionStorage.getItem(SPLASH_SESSION_KEY) === '1')
  const [splashDone, setSplashDone] = useState(() => splashAlreadySeen)
  const [searchHistory, setSearchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mobileSearchHistory') || '[]') } catch { return [] }
  })

  function addToHistory(place) {
    setSearchHistory(prev => {
      const next = [{ id: place.id, name: place.name, category: place.category, kecamatan: place.kecamatan },
        ...prev.filter(p => p.id !== place.id)].slice(0, 6)
      try { localStorage.setItem('mobileSearchHistory', JSON.stringify(next)) } catch {}
      return next
    })
  }
  function removeFromHistory(id) {
    setSearchHistory(prev => {
      const next = prev.filter(p => p.id !== id)
      try { localStorage.setItem('mobileSearchHistory', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const deferredQuery = useDeferredValue(query)

  const results = useMemo(
    () => places.filter((p) => activeCats.has(p.category) && matches(p, deferredQuery)),
    [activeCats, deferredQuery],
  )
  const visibleIds = useMemo(() => new Set(results.map((p) => p.id)), [results])
  const selected = places.find((p) => p.id === selectedId) || null

  const toggleCat = (c) =>
    setActiveCats((prev) => {
      const next = new Set(prev)
      if (next.has(c) && next.size > 1) next.delete(c)
      else next.add(c)
      return next
    })

  const closeAll = useCallback(() => {
    setSelectedId(null)
    setActiveSheet(null)
    setPickingSlot(null)
  }, [])

  const openSheet = (name) => {
    setSelectedId(null)
    setInfoClosing(false)
    setInfoDragY(0)
    setActiveSheet((prev) => (prev === name ? null : name))
  }

  function closeInfo() {
    setInfoClosing(true)
    setTimeout(() => { setActiveSheet(null); setInfoClosing(false); setInfoDragY(0) }, 360)
  }

  function handleInfoTouchStart(e) {
    infoTouchStartY.current = e.touches[0].clientY
    infoIsDragging.current = true
  }
  function handleInfoTouchMove(e) {
    const delta = e.touches[0].clientY - infoTouchStartY.current
    if (delta > 0) { setInfoDragY(delta); e.preventDefault() }
  }
  function handleInfoTouchEnd() {
    infoIsDragging.current = false
    if (infoDragY > 80) closeInfo()
    else setInfoDragY(0)
  }

  const searchResults = query.trim() ? results.slice(0, 8) : []

  return (
    <div className="mobile-app">
      {!splashDone && (
        <SplashScreen onDone={() => { sessionStorage.setItem(SPLASH_SESSION_KEY, '1'); setSplashDone(true) }} />
      )}

      <MapView
        places={places}
        boundary={boundary}
        visibleIds={visibleIds}
        selectedId={selectedId}
        onSelect={(id) => {
          if (pickingSlot) {
            const p = places.find((x) => x.id === id)
            setMapPickedPlace({ slot: pickingSlot, place: p })
            setPickingSlot(null)
          } else {
            setSelectedId(id)
            if (id != null) setActiveSheet(null)
          }
        }}
        panelOpen={!!selected}
        resetSignal={resetSignal}
        pickMode={!!pickingSlot}
        onMoved={() => {}}
        onHome={() => {}}
      />

      <div className="mobile-top">
        <div className="mobile-searchbar">
          <svg className="mobile-search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            className="mobile-search-input"
            placeholder={t.searchPlaceholder ?? 'Search destinations…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
          />
          {query && (
            <button className="mobile-search-clear" onClick={() => setQuery('')} aria-label="Clear">
              <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {searchFocused && searchResults.length > 0 && (
          <ul className="mobile-search-list">
            {searchResults.map((p) => (
              <li
                key={p.id}
                className="mobile-search-item"
                onMouseDown={() => { addToHistory(p); setSelectedId(p.id); setQuery('') }}
              >
                <span className="mobile-search-dot" style={{ '--c': CATEGORIES[p.category]?.color }} />
                <span className="mobile-search-text">
                  <strong>{p.name}</strong>
                  <small>{p.kecamatan}</small>
                </span>
                <span className="mobile-search-rating">★ {p.rating.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        )}

        {searchFocused && !query.trim() && searchHistory.length > 0 && (
          <ul className="mobile-search-list">
            <li className="mobile-search-history-label">{t.searchHistory}</li>
            {searchHistory.map((p) => (
              <li key={p.id} className="mobile-search-item">
                <svg className="mobile-search-history-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                </svg>
                <span
                  className="mobile-search-text"
                  onMouseDown={() => { setSelectedId(p.id); setQuery('') }}
                >
                  <strong>{p.name}</strong>
                  <small>{p.kecamatan}</small>
                </span>
                <button
                  className="mobile-search-history-remove"
                  onMouseDown={(e) => { e.preventDefault(); removeFromHistory(p.id) }}
                  aria-label={t.removeFromHistory}
                >
                  <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mobile-cats">
          {Object.entries(CATEGORIES).map(([key, c]) => (
            <button
              key={key}
              type="button"
              className={`mobile-cat-chip${activeCats.has(key) ? ' is-active' : ''}`}
              style={{ '--c': c.color }}
              onClick={() => toggleCat(key)}
            >
              <CategoryIcon category={key} size={13} className="mobile-cat-icon" />
              {c.label}
            </button>
          ))}
        </div>

        <div className="mobile-weather-wrap">
          <WeatherWidget lang={lang} />
          <button
            className="mobile-reset-btn"
            onClick={() => setResetSignal(s => s + 1)}
            aria-label={t.resetMap}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span style={{whiteSpace:'pre-line'}}>{t.resetMap}</span>
          </button>
        </div>
      </div>

      {pickingSlot && (
        <div className="mobile-pick-banner">
          <span>{t.pickBanner ?? 'Tap a pin to pick'} <strong>{pickingSlot}</strong></span>
          <button className="pick-cancel" onClick={() => setPickingSlot(null)}>{t.pickCancel ?? 'Cancel'}</button>
        </div>
      )}

      {(selected || activeSheet) && !pickingSlot && (
        <div
          className="mobile-sheet-backdrop"
          onClick={() => { setSelectedId(null); if (activeSheet === 'info') closeInfo(); else setActiveSheet(null) }}
        />
      )}

      {selected && (
        <DetailPanel place={selected} onClose={() => setSelectedId(null)} />
      )}

      {activeSheet === 'compare' && (
        <CompareSidePanel
          isMobile
          hidden={!!pickingSlot}
          places={places}
          onClose={() => { setActiveSheet(null); setPickingSlot(null) }}
          pickingSlot={pickingSlot}
          onStartPick={setPickingSlot}
          mapPickedPlace={mapPickedPlace}
          onMapPickConsumed={() => setMapPickedPlace(null)}
        />
      )}

      {activeSheet === 'ranking' && (
        <RankingPanel
          isMobile
          onClose={() => setActiveSheet(null)}
          onSelect={(id) => { setSelectedId(id); setActiveSheet(null) }}
        />
      )}

      {activeSheet === 'info' && (
        <div
          className={`mobile-info-sheet${infoClosing ? ' is-closing' : ''}`}
          style={{ transform: `translateY(${infoDragY}px)`, transition: infoIsDragging.current ? 'none' : 'transform 0.4s cubic-bezier(0.32,0.72,0,1)' }}
        >
          <div
            className="mobile-sheet-grip"
            onTouchStart={handleInfoTouchStart}
            onTouchMove={handleInfoTouchMove}
            onTouchEnd={handleInfoTouchEnd}
            onTouchCancel={handleInfoTouchEnd}
            style={{ touchAction: 'none', cursor: 'grab' }}
          />
          <div className="mobile-sheet-head">
            <span className="mobile-sheet-title">{t.settings ?? 'Settings'}</span>
            <button className="icon-btn" onClick={closeInfo} aria-label={t.close}>
              <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="mobile-info-body">
            <div className="info-row">
              <span>{t.language ?? 'Language'}</span>
              <div className="info-toggle-group">
                <button className={lang === 'EN' ? 'is-active' : ''} onClick={() => setLang('EN')}>EN</button>
                <button className={lang === 'ID' ? 'is-active' : ''} onClick={() => setLang('ID')}>ID</button>
              </div>
            </div>
            <a
              className="info-github"
              href="https://github.com/Tuknwm/tuknwm-ArcGisBandung"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      )}

      <nav className="mobile-navbar">
        <button
          className={`mobile-nav-btn${activeSheet === 'compare' ? ' is-active' : ''}`}
          onClick={() => openSheet('compare')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M9 12h6" />
          </svg>
          <span>{t.compareBtnLine1}<br/>{t.compareBtnLine2}</span>
        </button>

        <button
          className={`mobile-nav-btn${activeSheet === 'ranking' ? ' is-active' : ''}`}
          onClick={() => openSheet('ranking')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
          <span>{t.rankingBtnLine1}<br/>{t.rankingBtnLine2}</span>
        </button>

        <button
          className={`mobile-nav-btn${activeSheet === 'info' ? ' is-active' : ''}`}
          onClick={() => openSheet('info')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>{t.settings ?? 'Info'}</span>
        </button>
      </nav>
    </div>
  )
}
