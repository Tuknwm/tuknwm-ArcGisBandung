import { useEffect, useState } from 'react'

const WMO = {
  0:  { en: 'Clear sky',       id: 'Cerah',           icon: '☀️' },
  1:  { en: 'Mostly clear',    id: 'Hampir cerah',     icon: '🌤️' },
  2:  { en: 'Partly cloudy',   id: 'Berawan sebagian', icon: '⛅' },
  3:  { en: 'Overcast',        id: 'Mendung',          icon: '☁️' },
  45: { en: 'Foggy',           id: 'Berkabut',         icon: '🌫️' },
  48: { en: 'Icy fog',         id: 'Kabut es',         icon: '🌫️' },
  51: { en: 'Light drizzle',   id: 'Gerimis ringan',   icon: '🌦️' },
  53: { en: 'Drizzle',         id: 'Gerimis',          icon: '🌦️' },
  55: { en: 'Heavy drizzle',   id: 'Gerimis lebat',    icon: '🌧️' },
  61: { en: 'Light rain',      id: 'Hujan ringan',     icon: '🌧️' },
  63: { en: 'Rain',            id: 'Hujan',            icon: '🌧️' },
  65: { en: 'Heavy rain',      id: 'Hujan lebat',      icon: '🌧️' },
  80: { en: 'Rain showers',    id: 'Hujan deras',      icon: '🌧️' },
  81: { en: 'Rain showers',    id: 'Hujan deras',      icon: '🌧️' },
  82: { en: 'Violent showers', id: 'Hujan sangat deras', icon: '⛈️' },
  95: { en: 'Thunderstorm',    id: 'Badai petir',      icon: '⛈️' },
  96: { en: 'Thunderstorm',    id: 'Badai petir',      icon: '⛈️' },
  99: { en: 'Thunderstorm',    id: 'Badai petir',      icon: '⛈️' },
}

function getCondition(code) {
  return WMO[code] || { en: '–', id: '–', icon: '🌡️' }
}

export default function WeatherWidget({ lang = 'EN' }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=-6.9175&longitude=107.6191' +
      '&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m' +
      '&timezone=Asia%2FJakarta'

    fetch(url)
      .then((r) => r.json())
      .then((json) => setData(json.current))
      .catch(() => setError(true))
  }, [])

  if (error) return null
  if (!data) {
    return (
      <div className="weather-widget weather-widget--loading" aria-hidden="true">
        <span className="weather-skeleton" />
      </div>
    )
  }

  const cond = getCondition(data.weathercode)
  const label = lang === 'ID' ? cond.id : cond.en

  return (
    <div className="weather-widget" title="Bandung, Jawa Barat">
      <span className="weather-icon" aria-hidden="true">{cond.icon}</span>
      <div className="weather-body">
        <span className="weather-temp">{Math.round(data.temperature_2m)}°C</span>
        <span className="weather-cond">{label}</span>
      </div>
      <div className="weather-meta">
        <span>💧 {data.relative_humidity_2m}%</span>
        <span>💨 {Math.round(data.windspeed_10m)} km/h</span>
      </div>
    </div>
  )
}
