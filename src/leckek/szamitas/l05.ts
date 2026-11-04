// 5. lecke: diverzifikáció (3.5, 4.3). Csak a mag függvényeit hívja.

import { atlagosKorrelacio, egyenloSulyuVariancia, nemDiverzifikalhatoSzint, portfolioHozam } from '../../calc/portfolio.ts'
import { egyFaktorosPalyak } from '../../calc/szimulacio.ts'
import { formatSzam } from '../../lib/szam.ts'

export type Eset = 'kt' | 'ross'
export type L05 = { eset: Eset; n: number; sigma: number; k: number }

/**
 * Képlettári alap: a 3.4 példájának két részvénye (σ = 35% és 50%, k = 0,6) egyforma, átlagos σ-val
 * (42,5%). n = 2-nél így 38,0% jön ki; a 3.4 példa eltérő szórásokkal 38,2%-ot ad.
 */
export const L05_KT: L05 = { eset: 'kt', n: 2, sigma: 0.425, k: 0.6 }

/** 3.5 példa (3. ea, Ross 13.7): σ = 49,24%; az átlagos korreláció az 1000 elemű portfólió 19,21%-ából. */
export const L05_ROSS: L05 = { eset: 'ross', n: 10, sigma: 0.4924, k: atlagosKorrelacio(1000, 0.4924, 0.1921) }

export const L05_ALAP = L05_KT

/** A szimuláció: 100 eszköz 40 időszakon át, fix seed. */
export const L05_ESZKOZOK = 100
export const L05_IDOSZAKOK = 40
const SEED = 513

export type L05Eredmeny =
  | { hiba: string }
  | {
      hiba: undefined
      /** n elemű portfólió szórása */
      szoras: number
      /** egy eszköz szórása (n = 1) */
      egy: number
      /** n → ∞: σ√k */
      szint: number
      /** a variancia két része: kσ² (szisztematikus) és a maradék (diverzifikálható) */
      szisztematikusVar: number
      diverzifikalhatoVar: number
      gorbe: [number, number][]
      nMax: number
      probak: [boolean, boolean, boolean]
    }

export function sigmaP(n: number, sigma: number, k: number): number {
  return Math.sqrt(egyenloSulyuVariancia(n, sigma, k))
}

export function l05(s: L05): L05Eredmeny {
  if (!(s.sigma > 0)) return { hiba: 'A szórás csak pozitív lehet.' }
  if (s.k > 1) return { hiba: 'A korreláció legfeljebb 1 lehet.' }
  if (s.n > 1 && s.k < -1 / (s.n - 1)) return { hiba: `${s.n} elemnél ilyen alacsony átlagos korreláció nem lehetséges (legalább −1/(n − 1) = ${formatSzam(-1 / (s.n - 1), 3)} kell).` }
  const variancia = egyenloSulyuVariancia(s.n, s.sigma, s.k)
  const szint = s.k >= 0 ? nemDiverzifikalhatoSzint(s.sigma, s.k) : 0
  const nMax = Math.max(40, s.n)
  const gorbe: [number, number][] = []
  for (let n = 1; n <= nMax; n++) if (s.k >= -1 / Math.max(1, n - 1) || n === 1) gorbe.push([n, sigmaP(n, s.sigma, s.k)])
  const szisztematikusVar = Math.max(0, s.k) * s.sigma * s.sigma
  const tav = (n: number) => sigmaP(n, s.sigma, s.k) - szint
  return {
    hiba: undefined,
    szoras: Math.sqrt(variancia),
    egy: s.sigma,
    szint,
    szisztematikusVar,
    diverzifikalhatoVar: variancia - szisztematikusVar,
    gorbe,
    nMax,
    probak: [
      s.n === 50 && Math.abs(s.k) < 0.005,
      s.k >= 0 && tav(s.n) < 0.01 && (s.n === 1 || tav(s.n - 1) >= 0.01),
      s.eset === 'ross' && Math.abs(s.sigma - L05_ROSS.sigma) < 1e-9 && Math.abs(s.k - L05_ROSS.k) < 1e-9 && sigmaP(s.n, s.sigma, s.k) < 0.2 && sigmaP(s.n - 1, s.sigma, s.k) >= 0.2,
    ],
  }
}

/** Szemléltető hozampályák: 100 eszköz, és az első n egyenlő súlyú portfóliója (3.1). k < 0-nál 0-val szimulál. */
export function l05Palyak(s: L05) {
  const { eszkozok } = egyFaktorosPalyak({ eszkozok: L05_ESZKOZOK, idoszakok: L05_IDOSZAKOK, E: 0.1, sigma: s.sigma, k: s.k, seed: SEED })
  const n = Math.min(s.n, L05_ESZKOZOK)
  const a = Array(n).fill(1 / n)
  const portfolio = Array.from({ length: L05_IDOSZAKOK }, (_, t) =>
    portfolioHozam(
      a,
      eszkozok.slice(0, n).map((e) => e[t]),
    ),
  )
  return { eszkozok, portfolio, egy: eszkozok[0] }
}
