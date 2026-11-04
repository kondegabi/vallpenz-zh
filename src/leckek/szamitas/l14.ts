// 14. lecke: adómegtakarítás és optimális tőkeszerkezet (8.4, 8.6, 8.10). Csak a mag függvényeit hívja.

import { adomegtakaritasPvOrok, vallalatertekAdoval, valasztosErtek } from '../../calc/tokeszerkezet.ts'

export type L14 = {
  /** V_U, a csak saját tőkés vállalatérték (M USD) */
  VU: number
  Tc: number
  /** D, az adósság (M USD) */
  D: number
  /** a pénzügyi nehézségek költségének mérete: PV értéke D = D_MAX-nál (szemléltető, M USD) */
  nehezseg: number
  /** diás nézetben a nehézségek mérete az alapérték */
  bovitett: boolean
}

/** Az x tengely vége (M USD). */
export const L14_DMAX = 200
export const L14_NEHEZSEG_ALAP = 90

/** szem. adó 1: V_U = 288, T_C = 40%, D = 80 → PV(TS) = 32, V_L = 320 (M USD). */
export const L14_ALAP: L14 = { VU: 288, Tc: 0.4, D: 80, nehezseg: L14_NEHEZSEG_ALAP, bovitett: false }

/**
 * SZEMLÉLTETŐ függvény (a diákon nincs képlet, 28. dia): a pénzügyi nehézségek költségének jelenértéke
 * kis D-nél alig számít, később gyorsabban nő: PV = N · (D / D_MAX)³.
 */
export function nehezsegPv(nehezseg: number, D: number): number {
  return nehezseg * Math.pow(D / L14_DMAX, 3)
}

export type L14Eredmeny =
  | { hiba: string }
  | {
      hiba: undefined
      /** a ténylegesen használt nehézségméret (diás nézetben az alapérték) */
      nehezseg: number
      pvTS: number
      VL: number
      pvNehez: number
      /** a „tényleges” vállalatérték (8.10) az aktuális D-nél */
      V: number
      /** a görbe maximuma */
      dOpt: number
      vOpt: number
      /** igaz, ha a maximum a (0; D_MAX) nyílt szakaszon belül van */
      belso: boolean
      /** a tényleges érték a D függvényében, D = 0 … D_MAX */
      gorbe: [number, number][]
      /** y tengely: a legkisebb és legnagyobb megjelenítendő érték */
      yMin: number
      yMax: number
      probak: [boolean, boolean, boolean, boolean]
    }

export function l14(s: L14): L14Eredmeny {
  if (!(s.VU > 0)) return { hiba: 'A V_U (a csak saját tőkés vállalatérték) pozitív szám.' }
  if (s.Tc < 0 || s.Tc >= 1) return { hiba: 'Az adókulcs 0 és 100% között lehet (100% nem).' }
  if (!(s.D >= 0)) return { hiba: 'Az adósság nem lehet negatív.' }
  if (s.D > L14_DMAX) return { hiba: `Az ábra D = ${L14_DMAX} M USD-ig szól, ennél nagyobb adósságot nem rajzol.` }
  if (!(s.nehezseg >= 0)) return { hiba: 'A pénzügyi nehézségek költsége nem lehet negatív.' }

  const N = s.bovitett ? s.nehezseg : L14_NEHEZSEG_ALAP
  const ertek = (D: number) => valasztosErtek(s.VU, adomegtakaritasPvOrok(s.Tc, D), nehezsegPv(N, D))
  const lepes = 0.5
  const gorbe = Array.from({ length: Math.round(L14_DMAX / lepes) + 1 }, (_, i) => [i * lepes, ertek(i * lepes)] as [number, number])
  // a maximum a rácson; egyenlőségnél (pl. T_C = 0 és N = 0) a legkisebb D nyer
  const [dOpt, vOpt] = gorbe.reduce((m, p) => (p[1] > m[1] + 1e-12 ? p : m), gorbe[0])
  const pvTS = adomegtakaritasPvOrok(s.Tc, s.D)
  const pvNehez = nehezsegPv(N, s.D)
  const V = valasztosErtek(s.VU, pvTS, pvNehez)
  const ertekek = gorbe.map((p) => p[1])
  const vLMax = vallalatertekAdoval(s.VU, s.Tc, L14_DMAX)
  const lo = Math.min(s.VU, ...ertekek)
  const hi = Math.max(vLMax, s.VU)
  const tav = Math.max(hi - lo, 1)
  return {
    hiba: undefined,
    nehezseg: N,
    pvTS,
    VL: vallalatertekAdoval(s.VU, s.Tc, s.D),
    pvNehez,
    V,
    dOpt,
    vOpt,
    belso: dOpt > 0 && dOpt < L14_DMAX,
    gorbe,
    yMin: lo - 0.08 * tav,
    yMax: hi + 0.08 * tav,
    probak: [
      // D megduplázása az alapértékhez képest: PV(TS) = T_C · D is megduplázódik
      s.D >= 2 * L14_ALAP.D - 0.5 && s.Tc > 0,
      // D* fölött az érték már csökken
      dOpt > 0 && dOpt < L14_DMAX && s.D > dOpt && V < vOpt,
      // bővített: nehézségek nélkül a tényleges érték végig a V_L-en fut
      s.bovitett && s.nehezseg < 0.0005 && s.D > 0 && Math.abs(V - (s.VU + s.Tc * s.D)) < 1e-9,
      // bővített: adó nélkül nincs mit nyerni, csak a nehézségek költsége marad
      s.bovitett && s.Tc < 0.0005 && s.nehezseg > 0 && s.D > 0 && V < s.VU,
    ],
  }
}
