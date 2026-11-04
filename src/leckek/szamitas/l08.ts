// 8. lecke: SML és árazottság (5.1–5.3). Csak a mag függvényeit hívja.

import { arazas, capm, meredekseg, mrp } from '../../calc/capm.ts'
import { normalisMinta } from '../../calc/szimulacio.ts'

export type Eszkoz = { nev: string; beta: number; E: number }
export type L08 = { eset: 'GH' | 'AB'; rf: number; ErM: number; eszkozok: Eszkoz[] }

/** 5.2 példa (5. ea 26–27. dia): G és H. */
export const L08_GH: L08 = {
  eset: 'GH',
  rf: 0.02,
  ErM: 0.085,
  eszkozok: [
    { nev: 'G', beta: 1.6, E: 0.12 },
    { nev: 'H', beta: 0.8, E: 0.09 },
  ],
}

/** 4. ea 13–14. dia: A és B, r_f = 8%, E(r_M) nincs megadva (csak a két meredekség). */
export const L08_AB: L08 = {
  eset: 'AB',
  rf: 0.08,
  ErM: Number.NaN,
  eszkozok: [
    { nev: 'A', beta: 1.6, E: 0.2 },
    { nev: 'B', beta: 1.2, E: 0.16 },
  ],
}

const TURES = 0.001

export function l08(s: L08) {
  const vanSml = s.eset === 'GH' && Number.isFinite(s.ErM)
  const MRP = vanSml ? mrp(s.ErM, s.rf) : Number.NaN
  const eszkozok = s.eszkozok.map((e) => {
    const m = e.beta > 0 ? meredekseg(e.E, s.rf, e.beta) : Number.NaN
    if (!vanSml) return { ...e, meredekseg: m, elvart: undefined, arazas: undefined }
    const elvart = capm(s.rf, e.beta, MRP)
    return { ...e, meredekseg: m, elvart, arazas: arazas(e.E, s.rf, e.beta, MRP, TURES / 2) }
  })
  const smlen = (i: number) => vanSml && Math.abs(eszkozok[i].E - eszkozok[i].elvart!) <= TURES / 2
  const probak =
    s.eset === 'GH'
      ? [smlen(0), smlen(1), eszkozok.some((e, i) => Math.abs(e.beta - 1) < 0.001 && smlen(i))]
      : [Math.abs(eszkozok[0].meredekseg - eszkozok[1].meredekseg) < 0.0005]
  return { vanSml, MRP, eszkozok, probak }
}

/**
 * Szemléltető hozamfelhő az SML körül béta-sávonként (a bővített nézethez): a pontok a CAPM
 * szerinti hozam körül szórnak. Fix seed.
 */
export function l08Felho(s: L08): [number, number][] {
  if (!(s.eset === 'GH' && Number.isFinite(s.ErM))) return []
  const MRP = mrp(s.ErM, s.rf)
  const savok = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
  return savok.flatMap((b, i) => {
    const zaj = normalisMinta(18, 0, 0.012, 100 + i)
    const szet = normalisMinta(18, 0, 0.035, 200 + i)
    return zaj.map((z, j) => [b + szet[j], capm(s.rf, b + szet[j], MRP) + z] as [number, number])
  })
}
