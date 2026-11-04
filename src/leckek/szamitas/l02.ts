// 2. lecke: normális eloszlás és szigma-szabályok (2.4). Csak a mag függvényeit hívja.

import { normalisSuruseg, szigmaSav } from '../../calc/kockazat.ts'
import { normalisMinta } from '../../calc/szimulacio.ts'

export type L02 = { E: number; sigma: number }

/** 2.4 példa (jegyzet, Ross 12.11): nagyvállalati részvények 12,0% átlag, 19,8% szórás. */
export const L02_ALAP: L02 = { E: 0.12, sigma: 0.198 }

/** A szemléltető minta: 97 „év” (az 1. ea 21. diájának 1926–2022-es időszaka), fix seed. */
export const L02_EVEK = 97
// a seedet úgy választottam, hogy a minta szimmetrikus legyen, és a sávokba eső arány a 2.4 „kb.” értékeihez közel essen (66, 93, 97 év)
export const L02_SEED = 1329

/** A hisztogram rekeszei fél szigma szélesek, így a határaik egybeesnek a sávhatárokkal. */
const REKESZ_PER_SZIGMA = 2
const MAX_SZIGMA = 4

export type L02Eredmeny =
  | { hiba: 'A szórás csak pozitív lehet.' }
  | {
      hiba: undefined
      savok: { k: 1 | 2 | 3; also: number; felso: number; szelesseg: number }[]
      gorbe: [number, number][]
      /** a minta rekeszei: [alsó határ, felső határ, darab] */
      rekeszek: { also: number; felso: number; db: number }[]
      minta: number[]
      /** a mintából a ±kσ sávba eső arány (szemléltető, a 2.4 „kb.” értékeivel vethető össze) */
      mintaArany: [number, number, number]
      probak: [boolean, boolean, boolean]
    }

export function l02(s: L02): L02Eredmeny {
  if (!(s.sigma > 0)) return { hiba: 'A szórás csak pozitív lehet.' }
  const savok = ([1, 2, 3] as const).map((k) => {
    const [also, felso] = szigmaSav(s.E, s.sigma, k)
    return { k, also, felso, szelesseg: felso - also }
  })
  const lepes = 160
  const gorbe = Array.from({ length: lepes + 1 }, (_, i) => {
    const x = s.E - MAX_SZIGMA * s.sigma + (i / lepes) * 2 * MAX_SZIGMA * s.sigma
    return [x, normalisSuruseg(x, s.E, s.sigma)] as [number, number]
  })
  const minta = normalisMinta(L02_EVEK, s.E, s.sigma, L02_SEED)
  const w = s.sigma / REKESZ_PER_SZIGMA
  const n = MAX_SZIGMA * REKESZ_PER_SZIGMA
  const rekeszek = Array.from({ length: 2 * n }, (_, j) => ({ also: s.E + (j - n) * w, felso: s.E + (j - n + 1) * w, db: 0 }))
  for (const x of minta) {
    const j = Math.min(2 * n - 1, Math.max(0, Math.floor((x - s.E) / w) + n))
    rekeszek[j].db++
  }
  const mintaArany = savok.map((v) => minta.filter((x) => x >= v.also && x <= v.felso).length / minta.length) as [number, number, number]
  return {
    hiba: undefined,
    savok,
    gorbe,
    rekeszek,
    minta,
    mintaArany,
    probak: [
      Math.abs(s.sigma - 2 * L02_ALAP.sigma) < 0.0005,
      Math.abs(savok[0].also) < 0.0005,
      savok[1].also >= -0.00005,
    ],
  }
}
