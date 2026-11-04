// 9. lecke: az osztalékmodell (Gordon, 7.1) érzékenysége. Csak a mag függvényeit hívja.

import { d1, gordonAr, gordonRE } from '../../calc/toke.ts'

export type Eset = '4ea' | 'video'
export type L09 = {
  eset: Eset
  D0: number
  P0: number
  g: number
  /** a második grafikon rögzített r_E-je (P_0 a g függvényében) */
  rE2: number
}

/** 7.1 példa (4. ea): D_0 = 4, P_0 = 60, g = 6% → D_1 = 4,24, r_E = 13,07% (a javított érték). */
export const L09_4EA: L09 = { eset: '4ea', D0: 4, P0: 60, g: 0.06, rE2: gordonRE(d1(4, 0.06), 60, 0.06) }
/** 7.1 példa (videó): D_0 = 5, P_0 = 70, g = 4% → D_1 = 5,2, r_E = 11,43%. */
export const L09_VIDEO: L09 = { eset: 'video', D0: 5, P0: 70, g: 0.04, rE2: gordonRE(d1(5, 0.04), 70, 0.04) }
export const L09_ALAP = L09_4EA

export const G_MAX = 0.15

export type L09Eredmeny =
  | { hiba: string }
  | {
      hiba: undefined
      D1: number
      /** D_1 / P_0 (osztalékhozam) */
      osztalekHozam: number
      rE: number
      reGorbe: [number, number][]
      /** P_0 a g függvényében, rögzített r_E2 mellett (csak g < r_E2) */
      arGorbe: [number, number][]
      /** a második grafikon értéke a beállított g-nél; null, ha g ≥ r_E2 */
      ar: number | null
      /** P_0 változása, ha g 1 százalékponttal nő (a második grafikonon) */
      arErzekenyseg: number | null
      probak: [boolean, boolean, boolean]
    }

export function l09(s: L09): L09Eredmeny {
  if (!(s.P0 > 0)) return { hiba: 'Az árfolyam (P₀) csak pozitív lehet.' }
  if (!(s.D0 > 0)) return { hiba: 'Az osztalék (D₀) csak pozitív lehet.' }
  const D1 = d1(s.D0, s.g)
  const rE = gordonRE(D1, s.P0, s.g)
  const lepes = 150
  const reGorbe = Array.from({ length: lepes + 1 }, (_, i) => {
    const g = (i / lepes) * G_MAX
    return [g, gordonRE(d1(s.D0, g), s.P0, g)] as [number, number]
  })
  const arGorbe: [number, number][] = []
  const gVeg = Math.min(G_MAX, s.rE2) - 1e-6
  for (let i = 0; i <= 400; i++) {
    const g = (i / 400) * gVeg
    if (g < s.rE2) arGorbe.push([g, gordonAr(d1(s.D0, g), s.rE2, g)])
  }
  const ar = s.g < s.rE2 ? gordonAr(D1, s.rE2, s.g) : null
  const arPlusz = s.g + 0.01 < s.rE2 ? gordonAr(d1(s.D0, s.g + 0.01), s.rE2, s.g + 0.01) : null
  const alap = s.eset === '4ea' ? L09_4EA : L09_VIDEO
  return {
    hiba: undefined,
    D1,
    osztalekHozam: gordonRE(D1, s.P0, 0),
    rE,
    reGorbe,
    arGorbe,
    ar,
    arErzekenyseg: ar !== null && arPlusz !== null ? arPlusz - ar : null,
    probak: [
      ar !== null && s.rE2 - s.g < 0.01,
      Math.abs(s.D0 - 2 * alap.D0) < 1e-9 && Math.abs(s.P0 - alap.P0) < 1e-9 && Math.abs(s.g - alap.g) < 1e-9,
      s.eset === '4ea' && Math.abs(s.D0 - 4) < 1e-9 && Math.abs(s.P0 - 60) < 1e-9 && Math.abs(rE - 0.15) < 0.0005,
    ],
  }
}
