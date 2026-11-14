import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CATEGORIES } from '../lib/places'

const DEM_TILES = ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']
const WORLD = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
]

const STYLE = {
  version: 8,
  sources: {
    topo: {
      type: 'raster',
      tiles: ['a', 'b', 'c'].map((s) => `https://${s}.tile.opentopomap.org/{z}/{x}/{y}.png`),
      tileSize: 256,
      maxzoom: 17,
      attribution: '&copy; OpenStreetMap, SRTM &copy; OpenTopoMap',
    },
    dem: { type: 'raster-dem', tiles: DEM_TILES, encoding: 'terrarium', tileSize: 256, maxzoom: 13 },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#EFF1F3' } },
    {
      id: 'topo',
      type: 'raster',
      source: 'topo',
      paint: { 'raster-saturation': -0.65, 'raster-contrast': -0.25, 'raster-brightness-min': 0.12 },
    },
    {
      id: 'hillshade',
      type: 'hillshade',
      source: 'dem',
      paint: {
        'hillshade-shadow-color': '#2F5E35',
        'hillshade-highlight-color': '#FFFFFF',
        'hillshade-accent-color': '#1D3B23',
        'hillshade-exaggeration': 0.5,
      },
    },
  ],
  sky: {
    'sky-color': '#CFE3F0',
    'horizon-color': '#EFF1F3',
    'fog-color': '#EFF1F3',
    'sky-horizon-blend': 0.6,
    'horizon-fog-blend': 0.7,
    'fog-ground-blend': 0.4,
  },
}

function pinElement(place) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'pin-wrap'
  el.setAttribute('aria-label', `${place.name}, ${place.kecamatan}`)
  el.innerHTML = `<span class="pin" style="--c:${CATEGORIES[place.category].color}"><svg class="pin-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${CATEGORIES[place.category].icon}"/></svg></span><span class="pin-label"></span><span class="pin-tip"><strong></strong><span></span></span>`
  el.querySelector('.pin-label').textContent = place.name
  el.querySelector('.pin-tip strong').textContent = place.name
  el.querySelector('.pin-tip span').textContent = place.kecamatan
  return el
}

export default function MapView({ places, boundary, visibleIds, selectedId, onSelect, panelOpen, resetSignal, pickMode, onMoved, onHome }) {
  const el = useRef(null)
  const mapRef = useRef(null)
  const markers = useRef(new Map())
  const homeBounds = useRef(null)
  const autoFit = useRef(true)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const onMovedRef = useRef(onMoved)
  onMovedRef.current = onMoved
  const onHomeRef = useRef(onHome)
  onHomeRef.current = onHome

  useEffect(() => {
    const ring = boundary.features[0].geometry.coordinates[0]
    const bounds = ring.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(ring[0], ring[0]))
    homeBounds.current = bounds

    const style = {
      ...STYLE,
      sources: {
        ...STYLE.sources,
        kab: { type: 'geojson', data: boundary },
        mask: {
          type: 'geojson',
          data: { type: 'Polygon', coordinates: [WORLD, ...boundary.features[0].geometry.coordinates] },
        },
      },
      layers: [
        ...STYLE.layers,
        { id: 'mask', type: 'fill', source: 'mask', paint: { 'fill-color': '#EFF1F3', 'fill-opacity': 0.88 } },
        { id: 'kab-fill', type: 'fill', source: 'kab', paint: { 'fill-color': '#B3D89C', 'fill-opacity': 0.16 } },
        {
          id: 'kab-glow',
          type: 'line',
          source: 'kab',
          paint: { 'line-color': '#2F5E35', 'line-width': 8, 'line-opacity': 0.15, 'line-blur': 4 },
        },
        { id: 'kab-line', type: 'line', source: 'kab', paint: { 'line-color': '#2F5E35', 'line-width': 2.5 } },
      ],
    }

    const map = new maplibregl.Map({
      container: el.current,
      style,
      bounds,
      fitBoundsOptions: { padding: 24 },
      maxPitch: 70,
      maxTileCacheSize: 3000,
      maxTileCacheZoomLevels: 10,
      cancelPendingTileRequestsWhileZooming: false,
      fadeDuration: 0,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
      attributionControl: { compact: true },
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-left')

    places.forEach((p) => {
      const node = pinElement(p)
      node.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelectRef.current(p.id)
      })
      markers.current.set(p.id, new maplibregl.Marker({ element: node }).setLngLat([p.lng, p.lat]).addTo(map))
    })

    map.on('dragstart', () => { autoFit.current = false; onMovedRef.current?.() })
    map.on('wheel', () => { autoFit.current = false; onMovedRef.current?.() })
    const ro = new ResizeObserver(() => {
      map.resize()
      if (autoFit.current) map.fitBounds(bounds, { padding: 24, animate: false })
    })
    ro.observe(el.current)

    return () => {
      ro.disconnect()
      map.remove()
      markers.current.clear()
    }
  }, [places, boundary])

  useEffect(() => {
    const map = mapRef.current
    markers.current.forEach((m, id) => {
      const show = visibleIds.has(id) || id === selectedId
      const on = m.getElement().isConnected
      if (show && !on) m.addTo(map)
      if (!show && on) m.remove()
    })
  }, [visibleIds, selectedId])

  useEffect(() => {
    markers.current.forEach((m, id) => m.getElement().classList.toggle('is-selected', id === selectedId))
    if (selectedId == null) return
    autoFit.current = false
    const map = mapRef.current
    const m = markers.current.get(selectedId)
    const { clientWidth: w, clientHeight: h } = el.current
    const padding = !panelOpen
      ? 0
      : w > 760
        ? { top: 0, bottom: 0, left: 0, right: Math.min(380, w - 32) + 16 }
        : { top: 0, bottom: Math.round(h * 0.6), left: 0, right: 0 }
    map.flyTo({
      center: m.getLngLat(),
      zoom: 14.2,
      pitch: 58,
      bearing: map.getBearing() || -20,
      padding,
      duration: 2400,
      curve: 1.6,
    })
  }, [selectedId, panelOpen])

  useEffect(() => {
    if (resetSignal && homeBounds.current) {
      const map = mapRef.current
      map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 })
      map.fitBounds(homeBounds.current, { padding: 24, pitch: 0, bearing: 0, duration: 1600 })
      map.once('moveend', () => { autoFit.current = true; onHomeRef.current?.() })
    }
  }, [resetSignal])

  return <div ref={el} className={`map${pickMode ? ' map--pick' : ''}`} role="region" aria-label="Peta Kabupaten Bandung" />
}
