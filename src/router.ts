import { useEffect, useState } from 'react'

export type Utvonal =
  | { oldal: 'kezdolap' }
  | { oldal: 'kepletek' }
  | { oldal: 'keplet'; id: string }
  | { oldal: 'terkep' }
  | { oldal: 'felismero' }
  | { oldal: 'hibak' }
  | { oldal: 'gyakorlas' }
  | { oldal: 'gyakorlo'; cel: string }
  | { oldal: 'zh'; db: number; perc: number }
  | { oldal: 'zhSzimulacio' }
  | { oldal: 'statisztika' }
  | { oldal: 'leckek' }
  | { oldal: 'lecke'; szam: number }
  | { oldal: 'leckeMinta' }

export function utvonalHashbol(hash: string): Utvonal {
  const r = hash.replace(/^#\/?/, '')
  const k = /^k\/(\d{1,2}\.\d{1,2})$/.exec(r)
  if (k) return { oldal: 'keplet', id: k[1] }
  const gy = /^gy\/([\w-]+)$/.exec(r)
  if (gy) return { oldal: 'gyakorlo', cel: gy[1] }
  const zh = /^zh\/(\d+)\/(\d+)$/.exec(r)
  if (zh) return { oldal: 'zh', db: Math.min(20, Math.max(1, Number(zh[1]))), perc: Number(zh[2]) }
  const lecke = /^lecke\/(\d{1,2})$/.exec(r)
  if (lecke) return { oldal: 'lecke', szam: Number(lecke[1]) }
  if (r === 'leckek') return { oldal: 'leckek' }
  if (r === 'leckek/minta') return { oldal: 'leckeMinta' }
  if (r === 'kepletek') return { oldal: 'kepletek' }
  if (r === 'terkep') return { oldal: 'terkep' }
  if (r === 'felismero') return { oldal: 'felismero' }
  if (r === 'hibak') return { oldal: 'hibak' }
  if (r === 'gyakorlas') return { oldal: 'gyakorlas' }
  if (r === 'statisztika') return { oldal: 'statisztika' }
  if (r === 'zh-szimulacio') return { oldal: 'zhSzimulacio' }
  return { oldal: 'kezdolap' }
}

export const link = {
  kezdolap: '#/',
  kepletek: '#/kepletek',
  keplet: (id: string) => `#/k/${id}`,
  terkep: '#/terkep',
  felismero: '#/felismero',
  hibak: '#/hibak',
  gyakorlas: '#/gyakorlas',
  /** sablon id, vagy „csalad-capm” egy egész családhoz */
  gyakorlo: (cel: string) => `#/gy/${cel}`,
  zh: (db: number, perc: number) => `#/zh/${db}/${perc}`,
  statisztika: '#/statisztika',
  zhSzimulacio: '#/zh-szimulacio',
  leckek: '#/leckek',
  lecke: (szam: number) => `#/lecke/${szam}`,
  leckeMinta: '#/leckek/minta',
}

export function useUtvonal(): Utvonal {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const kezelo = () => {
      setHash(window.location.hash)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', kezelo)
    return () => window.removeEventListener('hashchange', kezelo)
  }, [])
  return utvonalHashbol(hash)
}
