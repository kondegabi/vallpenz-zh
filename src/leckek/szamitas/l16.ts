// 16. lecke: osztalék, visszaforgatás és árfolyam (10.1, 10.3). Csak a mag függvényeit hívja.

import { fenntarthatoNovekedes, kifizetesiRata, osztalekModellAr } from '../../calc/osztalek.ts'

export type L16 = {
  /** ROE, a megtartott nyereség hozama */
  ROE: number
  /** dp, az osztalék-kifizetési ráta: DIV_1 / EPS_1 */
  dp: number
  /** r, a részvényesek elvárt hozama */
  r: number
  /** EPS_1, a jövő évi egy részvényre jutó nyereség */
  EPS1: number
  /** bővített nézet: három ROE-görbe (r fölött, r-rel egyenlő, r alatt) */
  bovitett: boolean
}

/** SZEMLÉLTETŐ alapértékek (a diákon nincs számpélda): ROE = 15%, r = 12%, dp = 40%, EPS_1 = 5 → g = 9%, DIV_1 = 2, P_0 = 66,67. */
export const L16_ALAP: L16 = { ROE: 0.15, dp: 0.4, r: 0.12, EPS1: 5, bovitett: false }

export type Gorbe16 = {
  /** a görbe felirata */
  nev: string
  ROE: number
  /** [dp, P_0] azokra a dp-kre, ahol g < r és a P_0 az ábrán belül marad */
  pontok: [number, number][]
}

/** P_0 az osztalék-kifizetési rátából (10.3, 10.1); null, ha g ≥ r (nincs véges ár). */
export function arDpbol(ROE: number, dp: number, r: number, EPS1: number): number | null {
  const g = fenntarthatoNovekedes(ROE, dp)
  if (g >= r) return null
  return osztalekModellAr(dp * EPS1, r, g)
}

/** Az a dp, ahol g = r: ROE · (1 − dp) = r → dp = 1 − r/ROE. Ennél kisebb dp-nél (és ROE > r esetén) nincs véges ár. */
export function dpHatar(ROE: number, r: number): number {
  return 1 - r / ROE
}

/** A P_0 görbéje a dp függvényében, 0 és 1 között; azokat a pontokat hagyja ki, ahol nincs véges ár vagy az ár az ábra fölé nőne. */
export function gorbe(ROE: number, r: number, EPS1: number, yMax: number): [number, number][] {
  const N = 200
  const ki: [number, number][] = []
  for (let i = 0; i <= N; i++) {
    const dp = i / N
    const P = arDpbol(ROE, dp, r, EPS1)
    if (P !== null && P <= yMax) ki.push([dp, P])
  }
  return ki
}

export type L16Eredmeny =
  | { hiba: string }
  | {
      hiba: undefined
      /** g = ROE · (1 − dp) (10.3) */
      g: number
      /** DIV_1 = dp · EPS_1 */
      DIV1: number
      /** dp visszaszámolva a 10.2 szerint: DIV_1 / EPS_1 */
      dpEll: number
      /** igaz, ha g < r: van véges ár */
      veges: boolean
      /** P_0 (10.1); hiányzik, ha g ≥ r */
      P0?: number
      /** az a dp, ahol g = r (csak ROE > r esetén releváns, különben ≤ 0) */
      dpHatar: number
      /** a P_0 = EPS_1 / r szint: itt metszi egymást minden görbe dp = 1-nél */
      P0Ketto: number
      /** a mostani ROE görbéje */
      gorbe: [number, number][]
      /** a bővített nézet három görbéje: ROE fölött, egyenlő, alatta */
      gorbek: Gorbe16[]
      yMax: number
      probak: [boolean, boolean, boolean, boolean]
    }

export function l16(s: L16): L16Eredmeny {
  if (!(s.ROE > 0)) return { hiba: 'A ROE pozitív szám.' }
  if (!(s.r > 0)) return { hiba: 'Az elvárt hozam (r) pozitív szám.' }
  if (!(s.EPS1 > 0)) return { hiba: 'A jövő évi EPS pozitív szám.' }
  if (!(s.dp >= 0 && s.dp <= 1)) return { hiba: 'Az osztalék-kifizetési ráta 0 és 100% között lehet.' }

  const g = fenntarthatoNovekedes(s.ROE, s.dp)
  const DIV1 = s.dp * s.EPS1
  const P0 = arDpbol(s.ROE, s.dp, s.r, s.EPS1) ?? undefined
  // dp = 1-nél g = 0, ezért minden görbe P_0 = EPS_1 / r-ben ér véget; az ábra ennek 2,5-szereséig megy
  const P0Ketto = s.EPS1 / s.r
  const yMax = 2.5 * P0Ketto
  const alapAr = arDpbol(s.ROE, L16_ALAP.dp, s.r, s.EPS1)
  const gorbek: Gorbe16[] = [
    { nev: 'ROE > r', ROE: s.r * 1.25 },
    { nev: 'ROE = r', ROE: s.r },
    { nev: 'ROE < r', ROE: s.r * 0.75 },
  ].map((c) => ({ ...c, pontok: gorbe(c.ROE, s.r, s.EPS1, yMax) }))

  return {
    hiba: undefined,
    g,
    DIV1,
    dpEll: kifizetesiRata(DIV1, s.EPS1),
    veges: g < s.r,
    P0,
    dpHatar: dpHatar(s.ROE, s.r),
    P0Ketto,
    gorbe: gorbe(s.ROE, s.r, s.EPS1, yMax),
    gorbek,
    yMax,
    probak: [
      // ROE > r: kisebb dp (több visszatartott nyereség) → magasabb ár
      s.ROE > s.r && s.dp <= L16_ALAP.dp - 0.1 + 1e-9 && P0 !== undefined && (alapAr === null || P0 > alapAr),
      // ROE = r: az ár nem függ dp-től
      Math.abs(s.ROE - s.r) < 1e-9 && Math.abs(s.dp - L16_ALAP.dp) >= 0.1 && P0 !== undefined,
      // ROE < r: nagyobb dp (több osztalék) → magasabb ár
      s.ROE < s.r && s.dp >= L16_ALAP.dp + 0.2 - 1e-9 && P0 !== undefined && alapAr !== null && P0 > alapAr,
      // g ≥ r: nincs véges ár
      !(g < s.r),
    ],
  }
}
