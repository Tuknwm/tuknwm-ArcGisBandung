import { useEffect, useId, useRef, useState } from 'react'
import { CATEGORIES } from '../lib/places'
import CategoryIcon from './CategoryIcon'
import { useLang } from '../lib/LangContext'

const HISTORY_KEY = 'sb_history'
const MAX_HISTORY = 5

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) ?? [] } catch { return [] }
}
function saveHistory(items) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items)) } catch {}
}

function Highlight({ text, query }) {
  const q = query.trim().toLowerCase()
  const i = q ? text.toLowerCase().indexOf(q) : -1
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

export default function SearchBar({ query, onQuery, results, onPick }) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [history, setHistory] = useState(loadHistory)
  const input = useRef(null)
  const listId = useId()
  const list = results.slice(0, 7)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement !== input.current) {
        e.preventDefault()
        input.current.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const addHistory = (p) => {
    const next = [p, ...history.filter(h => h.id !== p.id)].slice(0, MAX_HISTORY)
    setHistory(next)
    saveHistory(next)
  }

  const removeHistory = (id) => {
    const next = history.filter(h => h.id !== id)
    setHistory(next)
    saveHistory(next)
  }

  const pick = (p) => {
    addHistory(p)
    onPick(p)
    setOpen(false)
    input.current.blur()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(a + 1, list.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && list[active]) {
      pick(list[active])
    } else if (e.key === 'Escape') {
      if (query) onQuery('')
      else input.current.blur()
      setOpen(false)
    }
  }

  const showResults = open && query.trim().length > 0
  const showHistory = open && query.trim().length === 0 && history.length > 0

  return (
    <div className="search">
      <label className="search-field">
        <span className="sr-only">Cari destinasi wisata</span>
        <input
          ref={input}
          type="search"
          role="combobox"
          aria-expanded={showResults || showHistory}
          aria-controls={listId}
          aria-activedescendant={showResults && list[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => {
            onQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
        />
        {query ? (
          <button type="button" className="search-clear" aria-label="Hapus pencarian" onClick={() => onQuery('')}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="search-icon">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        )}
      </label>

      {showResults && (
        <ul className="search-list" id={listId} role="listbox">
          {list.length === 0 && <li className="search-empty">Tidak ada destinasi yang cocok.</li>}
          {list.map((p, i) => (
            <li
              key={p.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'is-active' : ''}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(p)
              }}
            >
              <CategoryIcon category={p.category} size={15} />
              <span className="search-text">
                <strong>
                  <Highlight text={p.name} query={query} />
                </strong>
                <small>
                  <Highlight text={p.kecamatan} query={query} /> · {p.rawCategory}
                </small>
              </span>
              <span className="search-rating">★ {p.rating.toFixed(1)}</span>
            </li>
          ))}
          {results.length > list.length && (
            <li className="search-more">+{results.length - list.length} lainnya ditandai di peta</li>
          )}
        </ul>
      )}

      {showHistory && (
        <ul className="search-list search-list--history" id={listId} role="listbox" aria-label="Pencarian terakhir">
          <li className="search-history-label">{t.searchRecent ?? 'Pencarian terakhir'}</li>
          {history.map((p) => (
            <li
              key={p.id}
              role="option"
              className="search-history-item"
              onMouseDown={(e) => {
                e.preventDefault()
                pick(p)
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="search-history-icon">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              <span className="search-text">
                <strong>{p.name}</strong>
                <small>{p.kecamatan} · {p.rawCategory}</small>
              </span>
              <button
                type="button"
                className="search-history-remove"
                aria-label={`Hapus ${p.name} dari riwayat`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  removeHistory(p.id)
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
