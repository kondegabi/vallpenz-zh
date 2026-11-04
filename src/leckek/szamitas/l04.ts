// 4. lecke: kételemű portfólió (3.1–3.4). Csak a mag függvényeit hívja.

import { korreltMinta } from '../../calc/szimulacio.ts'
import { azonosSzorasuHatekony, minVarianciaSuly, portfolioGorbe, portfolioHozam, portfolioVarianciaKorr } from '../../calc/portfolio.ts'

export type L04 = { a: number; k: number; E1: number; E2: number; s1: number; s2: number }

/** A képlettár kételemű adatsora (2.1, 3.3, 3.4 példák): 1 = A részvény, 2 = B részvény. */
/**
 * Jelölés a diák szerint: a két részvény A és B (2. ea példái; a képletben az 1-es és a 2-es index).
 * A minimális szórású portfólió „Min σ”: a 3. ea 11–12. diáján ezt „A” jelöli, ami itt az A részvénnyel keveredne.
 */
export const L04_NEVEK = { r1: 'A', r2: 'B', min: 'Min σ' } as const

export const L04_ALAP: L04 = { a: 0.5, k: -1, E1: 0.2, E2: 0.25, s1: 0.1, s2: 0.45 }

function pont(s: L04, a: number, k = s.k) {
  return {
    a1: a,
    E: portfolioHozam([a, 1 - a], [s.E1, s.E2]),
    szoras: Math.sqrt(Math.max(0, portfolioVarianciaKorr(a, 1 - a, s.s1, s.s2, k))),
  }
}

export function l04(s: L04) {
  if (!(s.s1 > 0) || !(s.s2 > 0)) {
    return { hiba: 'A szórás csak pozitív lehet, ezért a görbe így nem értelmezett.' as const }
  }
  const valasztott = pont(s, s.a)
  const aMin = Math.min(1, Math.max(0, minVarianciaSuly(s.s1, s.s2, s.k)))
  const min = pont(s, aMin)
  const gorbe = portfolioGorbe(s.E1, s.E2, s.s1, s.s2, s.k, 160)
  const hatekonyAg = gorbe.filter((g) => g.E >= min.E - 1e-12)
  const b3 = azonosSzorasuHatekony(s.a, s.E1, s.E2, s.s1, s.s2, s.k)
  const minK0 = minVarianciaSuly(s.s1, s.s2, 0)
  return {
    hiba: undefined,
    valasztott,
    min,
    gorbe,
    hatekonyAg,
    hatekony: b3 === null,
    b3,
    skalaPontok: [-1, -0.5, 0, 0.5, 1].map((k) => ({ k, szoras: pont(s, s.a, k).szoras })),
    probak: [
      s.k === -1 && valasztott.szoras < 0.001,
      s.k === 1,
      s.k === 0 && Math.abs(s.a - minK0) < 0.005,
    ],
    minK0,
  }
}

/** A kis kovariancia-pontdiagram szemléltető mintája: σ₁, σ₂ szórású, k korrelációjú párok. */
export function l04Minta(s: L04) {
  return korreltMinta(120, s.k, 17, { s1: s.s1, s2: s.s2 })
}
