import { useCallback, useDeferredValue, useEffect, useMemo, useState, useRef } from 'react'
import MapView from './components/MapView'
import SplashScreen from './components/SplashScreen'
import SearchBar from './components/SearchBar'
import DetailPanel from './components/DetailPanel'
import { CompareButton, CompareSidePanel } from './components/ComparePanel'
import CategoryIcon from './components/CategoryIcon'
import { RankingButton, RankingPanel } from './components/RankingPanel'
import Scenery from './components/Scenery'
import WeatherWidget from './components/WeatherWidget'
import { CATEGORIES, boundary, matches, places } from './lib/places'
import { useLang } from './lib/LangContext'
import './App.css'

const counts = places.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] || 0) + 1 }), {})
const SPLASH_SESSION_KEY = 'splashSeen:v4'

function MobileMaintenance() {
  return (
    <div className="mobile-maintenance">
      <p className="mobile-maintenance-text">In Maintenance</p>
      <p className="mobile-maintenance-sub">Only for mobile</p>
    </div>
  )
}

export default function App() {
  const { t, lang } = useLang()
  const [query, setQuery] = useState('')
  const [activeCats, setActiveCats] = useState(() => new Set(Object.keys(CATEGORIES)))
  const [selectedId, setSelectedId] = useState(null)
  const [compareOpen, setCompareOpen] = useState(false)
  const [rankingOpen, setRankingOpen] = useState(false)
  const [pickingSlot, setPickingSlot] = useState(null)
  const [mapPickedPlace, setMapPickedPlace] = useState(null)
  const [resetSignal, setResetSignal] = useState(0)
  const [mapMoved, setMapMoved] = useState(false)
  const [splashAlreadySeen] = useState(() => sessionStorage.getItem(SPLASH_SESSION_KEY) === '1')
  const [splashDone, setSplashDone] = useState(() => splashAlreadySeen)
  const deferredQuery = useDeferredValue(query)

  const results = useMemo(
    () => places.filter((p) => activeCats.has(p.category) && matches(p, deferredQuery)),
    [activeCats, deferredQuery],
  )
  const visibleIds = useMemo(() => new Set(results.map((p) => p.id)), [results])
  const selected = places.find((p) => p.id === selectedId) || null

  const stats = useMemo(() => {
    const kec = new Set(results.map((p) => p.kecamatan)).size
    const avg = results.length ? results.reduce((s, p) => s + p.rating, 0) / results.length : 0
    return { total: results.length, kec, avg }
  }, [results])

  const toggleCat = (c) =>
    setActiveCats((prev) => {
      const next = new Set(prev)
      if (next.has(c) && next.size > 1) next.delete(c)
      else next.add(c)
      return next
    })

  const close = useCallback(() => setSelectedId(null), [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && document.activeElement?.type !== 'search' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  useEffect(() => {
    const shouldLockScroll = !!selected || compareOpen
    if (!shouldLockScroll) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [selected, compareOpen])

  return (
    <>
    <MobileMaintenance />
    {!splashDone && <SplashScreen onDone={() => { sessionStorage.setItem(SPLASH_SESSION_KEY, '1'); setSplashDone(true) }} />}
    <main className="app">
      <section className={`explorer${splashDone ? (splashAlreadySeen ? ' explorer--instant' : ' explorer--reveal') : ''}`} aria-labelledby="page-title">
        <div className="side">
          <div className="intro">
            <h1 id="page-title" className="intro-title">{t.title}</h1>
            <p className="intro-desc">{t.desc.replace('108', places.length)}</p>
          </div>

          <p className="section-label">{t.searchLabel}</p>
          <SearchBar
            query={query}
            onQuery={setQuery}
            results={results}
            onPick={(p) => setSelectedId(p.id)}
          />

          <fieldset className="filters">
            <legend>{t.categoryLabel}</legend>
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <button
                key={key}
                type="button"
                className="chip"
                aria-pressed={activeCats.has(key)}
                style={{ '--c': c.color }}
                onClick={() => toggleCat(key)}
              >
                <CategoryIcon category={key} size={14} className="chip-icon" />
                {c.label}
                <span className="chip-count">{counts[key]}</span>
              </button>
            ))}
          </fieldset>

          <dl className="stats" aria-live="polite">
            <div>
              <dt>{t.statsShown}</dt>
              <dd>{stats.total}</dd>
            </div>
            <div>
              <dt>{t.statsDistrict}</dt>
              <dd>{stats.kec}</dd>
            </div>
            <div>
              <dt>{t.statsAvg}</dt>
              <dd>★ {stats.avg ? stats.avg.toFixed(1) : '–'}</dd>
            </div>
          </dl>

          <Scenery />
        </div>

        <div className={`stage ${selected ? 'has-detail' : ''} ${compareOpen ? 'has-compare' : ''}`}>
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
                if (id != null) { setCompareOpen(false); setRankingOpen(false) }
              }
            }}
            panelOpen={!!selected}
            resetSignal={resetSignal}
            pickMode={!!pickingSlot}
            onMoved={() => setMapMoved(true)}
            onHome={() => setMapMoved(false)}
          />
          {pickingSlot && (
            <div className="pick-banner">
              <span>{t.pickBanner} <strong>{pickingSlot}</strong></span>
              <button className="pick-cancel" onClick={() => setPickingSlot(null)}>{t.pickCancel}</button>
            </div>
          )}
          <div className="map-controls map-controls--left">
            <button
              type="button"
              className="reset-btn"
              disabled={!mapMoved}
              onClick={() => {
                setSelectedId(null)
                setResetSignal((n) => n + 1)
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" />
              </svg>
              {t.resetBtn}
            </button>
            <CompareButton active={compareOpen} label={t.compareBtn} onClick={() => { setCompareOpen(true); setSelectedId(null); setRankingOpen(false) }} />
            <RankingButton active={rankingOpen} label={t.rankingBtn} onClick={() => { setRankingOpen(true); setSelectedId(null); setCompareOpen(false) }} />
            <div className="map-nav-hint">
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 11V6.5a2.5 2.5 0 0 0-5 0V11M18 11a2.5 2.5 0 0 1 2.5 2.5V17a6 6 0 0 1-6 6h-3A6.5 6.5 0 0 1 5 16.5v-5a2 2 0 0 1 4 0v3M13 11V4.5a2.5 2.5 0 0 0-5 0V11M9 11v-1a2 2 0 0 0-4 0v5"/></svg>
                {t.panLeft}
              </span>
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M3 12h18M12 3v18"/></svg>
                {t.panRight}
              </span>
            </div>
          </div>
          <div className="map-controls map-controls--right">
            <WeatherWidget lang={lang} />
          </div>
          {stats.total === 0 && <div className="map-empty">{t.noResult}</div>}
          <DetailPanel place={selected} onClose={close} />
          {rankingOpen && (
            <RankingPanel
              onClose={() => setRankingOpen(false)}
              onSelect={(id) => { setSelectedId(id); setRankingOpen(false) }}
            />
          )}
          {compareOpen && (
            <CompareSidePanel
              places={places}
              onClose={() => { setCompareOpen(false); setPickingSlot(null) }}
              pickingSlot={pickingSlot}
              onStartPick={setPickingSlot}
              mapPickedPlace={mapPickedPlace}
              onMapPickConsumed={() => setMapPickedPlace(null)}
            />
          )}
        </div>
      </section>
    </main>
    </>
  )
}
