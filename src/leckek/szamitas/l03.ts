// 3. lecke: várható hozam és szórás állapotokból (2.1–2.2). Csak a mag függvényeit hívja.

import { szoras, varianciaLevezetes } from '../../calc/kockazat.ts'
import { korreltMinta } from '../../calc/szimulacio.ts'
import { pct } from '../../gyakorlas/formaz.ts'

export type Allapot = { p: number; r: number }
export type L03 = { allapotok: Allapot[] }

/** 2.2 példa (2. ea): 20% / 80%, A: 10% / 30% → E = 26%, σ² = 0,0064, σ = 8%. */
export const L03_22: Allapot[] = [
  { p: 0.2, r: 0.1 },
  { p: 0.8, r: 0.3 },
]
/** 2.1 példa (2. ea), A részvény: 50% / 50%, 10% / 30% → E = 20% (σ = 10%, 3.3 példa). */
export const L03_21A: Allapot[] = [
  { p: 0.5, r: 0.1 },
  { p: 0.5, r: 0.3 },
]
/** 2.1 példa (2. ea), B részvény: 50% / 50%, 70% / −20% → E = 25% (σ = 45%, 3.3 példa). */
export const L03_21B: Allapot[] = [
  { p: 0.5, r: 0.7 },
  { p: 0.5, r: -0.2 },
]

export const L03_ALAP: L03 = { allapotok: L03_22 }

const TURES = 1e-6

export type L03Eredmeny =
  | { hiba: string; osszeg: number }
  | {
      hiba: undefined
      osszeg: number
      E: number
      variancia: number
      szoras: number
      sorok: ReturnType<typeof varianciaLevezetes>['sorok']
      /** két állapotnál: σ a p₁ függvényében (a fejléc csúszkájához) */
      p1Gorbe?: [number, number][]
      probak: [boolean, boolean, boolean]
    }

export function l03(s: L03): L03Eredmeny {
  const p = s.allapotok.map((a) => a.p)
  const r = s.allapotok.map((a) => a.r)
  const osszeg = p.reduce((x, y) => x + y, 0)
  if (p.some((x) => x < 0)) return { hiba: 'A valószínűség nem lehet negatív.', osszeg }
  if (Math.abs(osszeg - 1) > TURES) return { hiba: `A valószínűségek összege most ${pct(osszeg, 2)}; 1-nek kell lennie.`, osszeg }
  const lev = varianciaLevezetes(p, r)
  const ketto = s.allapotok.length === 2
  const p1Gorbe = ketto ? Array.from({ length: 101 }, (_, i) => [i / 100, szoras([i / 100, 1 - i / 100], r)] as [number, number]) : undefined
  const r21A = L03_21A.map((a) => a.r)
  return {
    hiba: undefined,
    osszeg,
    E: lev.Er,
    variancia: lev.variancia,
    szoras: lev.szoras,
    sorok: lev.sorok,
    p1Gorbe,
    probak: [
      ketto && Math.abs(p[0] - 0.5) < 0.005 && Math.abs(r[0] - r[1]) > 1e-9,
      ketto && Math.abs(r[0] - r21A[0]) < 1e-9 && Math.abs(r[1] - r21A[1]) < 1e-9 && Math.abs(lev.Er - 0.2) < 0.0005,
      lev.szoras < 1e-9,
    ],
  }
}

/** A 2. ea 11. diájának szemléltető × pontfelhője (σ, E(r)), fix seed. */
export function l03Felho(): [number, number][] {
  return korreltMinta(34, 0.55, 211, { E1: 0.3, s1: 0.07, E2: 0.14, s2: 0.045 }).map(([sigma, E]) => [Math.max(0.02, sigma), E])
}
