import { useState, useEffect, useRef } from 'react'
import { useLang } from '../lib/LangContext'

export default function InfoPanel() {
  const { lang, setLang, t } = useLang()
  const [visible, setVisible] = useState(false)
  const panelRef = useRef(null)
  const wrapRef  = useRef(null)
  const timerRef = useRef(null)

  function openPanel() {
    clearTimeout(timerRef.current)
    setVisible(true)
    // double rAF: element paints at scale(0) first, then transition to scale(1)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        panelRef.current?.classList.add('is-open')
      })
    )
  }

  function closePanel() {
    const el = panelRef.current
    if (!el) return
    el.classList.remove('is-open')
    el.classList.add('is-closing')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 220)
  }

  useEffect(() => {
    function onOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) closePanel()
    }
    if (visible) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [visible])

  return (
    <div className="info-panel" ref={wrapRef}>
      {visible && (
        <div className="info-popout" ref={panelRef}>
          <p className="info-popout-title">{t.settings}</p>

          <div className="info-row">
            <span>{t.language}</span>
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
      )}

      <button
        className={`info-btn${visible ? ' is-active' : ''}`}
        onClick={() => visible ? closePanel() : openPanel()}
        aria-label="Info & Settings"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </button>
    </div>
  )
}
