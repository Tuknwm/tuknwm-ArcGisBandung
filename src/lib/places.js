import wisataRaw from '../data/Lokasi_Wisata.geojson?raw'
import batasRaw from '../data/Batas_Kabupaten_Bandung.geojson?raw'

export const CATEGORIES = {
  Alam: {
    color: '#3F7D3A', label: 'Alam',
    icon: 'M3 20 L8 10 L11 15 L14 8 L21 20Z M17 7 A2 2 0 1 1 17.01 7',
  },
  Buatan: {
    color: '#D08A2E', label: 'Buatan',
    icon: 'M3 21h18M5 21V9l7-6 7 6v12M9 21v-6h6v6',
  },
  Budaya: {
    color: '#B5533C', label: 'Budaya',
    icon: 'M2 20h20M4 20V10M20 20V10M12 4 4 10h16L12 4ZM9 20v-5h6v5',
  },
  'Desa Wisata': {
    color: '#2E7A80', label: 'Desa Wisata',
    icon: 'M3 21h18M3 21V9l5-4 4 3 4-3 5 4v12M9 21v-5h6v5M12 9v3',
  },
}

function groupOf(raw) {
  const c = raw.toLowerCase()
  if (c.includes('desa wisata')) return 'Desa Wisata'
  if (c.startsWith('budaya')) return 'Budaya'
  if (c.startsWith('buatan') || c.startsWith('wisata buatan')) return 'Buatan'
  return 'Alam'
}

export const boundary = JSON.parse(batasRaw)

export const places = JSON.parse(wisataRaw).features.map((f) => {
  const p = f.properties
  const [lng, lat] = f.geometry.coordinates
  return {
    id: p.OBJECTID,
    name: p.Nama_Destinasi.trim(),
    kecamatan: p.Kecamatan,
    rawCategory: p.Kategori_Awal,
    category: groupOf(p.Kategori_Awal),
    address: p.Alamat_Desa,
    price: p.Harga_Tiket__Rp_,
    distance: p.Jarak_dari_Soreang__km_,
    facility: p.Fasilitas__Skor_1_5_,
    access: p.Aksesibilitas__Skor_1_5_,
    rating: p.Rating__0_5_,
    info: p.Potensi_Informasi_Tambahan,
    sources: [...new Set((p.Sumber_Data__URL_ || '').split('\n').map((s) => s.trim()).filter(Boolean))],
    lat,
    lng,
  }
})

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function matches(place, query) {
  if (!query) return true
  const q = norm(query.trim())
  return [place.name, place.kecamatan, place.rawCategory, place.address].some((v) => norm(v).includes(q))
}

export const formatRupiah = (n) =>
  n === 0 ? 'Gratis' : 'Rp' + n.toLocaleString('id-ID')
