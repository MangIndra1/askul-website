export type ConstellationDef = {
  id: string
  name: string
  meaning: string
  fact: string
  stars: { x: number; y: number }[]
  lines: [number, number][]
}

// Semua koordinat dalam viewBox 0 0 200 150 — pola disederhanakan biar
// tetap kebaca sebagai bentuk aslinya di layar kecil, bukan atlas presisi.
export const CONSTELLATIONS: ConstellationDef[] = [
  {
    id: 'ursa-major',
    name: 'Ursa Major',
    meaning: 'Beruang Besar',
    fact: 'Rumah bagi "Biduk" (Big Dipper) — pola tujuh bintang paling ikonik di langit utara, dipakai buat nemuin arah sejak zaman purba.',
    stars: [
      { x: 40, y: 95 }, { x: 35, y: 55 }, { x: 78, y: 42 }, { x: 90, y: 80 },
      { x: 120, y: 65 }, { x: 150, y: 78 }, { x: 175, y: 58 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
  },
  {
    id: 'orion',
    name: 'Orion',
    meaning: 'Sang Pemburu',
    fact: 'Salah satu rasi paling gampang dikenali — tiga bintang "sabuk"-nya berbaris rapi persis di tengah.',
    stars: [
      { x: 40, y: 20 }, { x: 115, y: 25 }, { x: 62, y: 68 }, { x: 78, y: 73 },
      { x: 94, y: 78 }, { x: 105, y: 132 }, { x: 48, y: 128 },
    ],
    lines: [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 6], [4, 5]],
  },
  {
    id: 'cygnus',
    name: 'Cygnus',
    meaning: 'Angsa',
    fact: 'Dijuluki "Salib Utara" — bentuknya kayak angsa yang terbang menyusuri jalur Bima Sakti.',
    stars: [
      { x: 100, y: 12 }, { x: 100, y: 45 }, { x: 100, y: 75 }, { x: 42, y: 58 },
      { x: 70, y: 67 }, { x: 130, y: 83 }, { x: 158, y: 92 }, { x: 100, y: 105 }, { x: 100, y: 140 },
    ],
    lines: [[0, 1], [1, 2], [2, 4], [4, 3], [2, 5], [5, 6], [2, 7], [7, 8]],
  },
  {
    id: 'andromeda',
    name: 'Andromeda',
    meaning: 'Sang Putri',
    fact: 'Dinamai dari putri dalam mitologi Yunani — jadi rumah bagi galaksi tetangga terdekat Bima Sakti.',
    stars: [
      { x: 25, y: 35 }, { x: 58, y: 52 }, { x: 92, y: 72 }, { x: 122, y: 92 }, { x: 152, y: 102 }, { x: 178, y: 128 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  },
  {
    id: 'aquila',
    name: 'Aquila',
    meaning: 'Sang Elang',
    fact: 'Bentuknya kayak elang terbang, dengan bintang terang Altair bersinar tepat di tengah dadanya.',
    stars: [
      { x: 100, y: 25 }, { x: 100, y: 68 }, { x: 52, y: 88 }, { x: 148, y: 88 }, { x: 72, y: 122 }, { x: 128, y: 122 },
    ],
    lines: [[0, 1], [1, 2], [1, 3], [2, 4], [3, 5]],
  },
  {
    id: 'pegasus',
    name: 'Pegasus',
    meaning: 'Kuda Terbang',
    fact: 'Dikenal lewat "Kotak Besar Pegasus" — empat bintang yang bentuknya persis persegi raksasa di langit.',
    stars: [
      { x: 50, y: 40 }, { x: 150, y: 40 }, { x: 150, y: 120 }, { x: 50, y: 120 },
      { x: 25, y: 65 }, { x: 10, y: 90 }, { x: 175, y: 58 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [4, 5], [1, 6]],
  },
  {
    id: 'hydra',
    name: 'Hydra',
    meaning: 'Ular Air',
    fact: 'Rasi bintang TERPANJANG di seluruh langit malam — melintang lebih dari seperempat cakrawala.',
    stars: [
      { x: 8, y: 50 }, { x: 30, y: 68 }, { x: 55, y: 52 }, { x: 80, y: 72 }, { x: 105, y: 58 },
      { x: 130, y: 78 }, { x: 155, y: 62 }, { x: 178, y: 82 }, { x: 195, y: 65 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]],
  },
  {
    id: 'hercules',
    name: 'Hercules',
    meaning: 'Sang Pahlawan',
    fact: 'Dinamai dari pahlawan mitologi Yunani — dikenal lewat pola "Keystone", trapesium empat bintang di tengahnya.',
    stars: [
      { x: 75, y: 50 }, { x: 130, y: 45 }, { x: 140, y: 90 }, { x: 65, y: 95 },
      { x: 30, y: 28 }, { x: 175, y: 112 }, { x: 25, y: 122 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [2, 5], [3, 6]],
  },
]

// 1 bintang = 30 XP. Bintang diisi berurutan — satu rasi harus penuh dulu
// baru lanjut ke rasi berikutnya, biar berasa "koleksi yang lagi dibangun".
export const STARS_PER_XP = 30

export type ConstellationProgress = ConstellationDef & {
  lit: number
  status: 'completed' | 'active' | 'locked'
}

export function computeConstellationProgress(xpTotal: number): ConstellationProgress[] {
  let remainingStars = Math.floor(xpTotal / STARS_PER_XP)

  return CONSTELLATIONS.map((c) => {
    const lit = Math.min(remainingStars, c.stars.length)
    remainingStars -= lit
    const status: ConstellationProgress['status'] =
      lit === c.stars.length ? 'completed' : lit > 0 ? 'active' : 'locked'
    return { ...c, lit, status }
  })
}