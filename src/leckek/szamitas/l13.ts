// 13. lecke: MM-tételek, tőkeköltség és tőkeáttétel (8.1, 8.3, 8.7, 8.8). Csak a mag függvényeit hívja.

import { adosRE, mmIIRE, modositottWacc, tokeSzerkezetHozam } from '../../calc/tokeszerkezet.ts'

export type L13 = {
  /** r_A, az eszközök hozama (adó nélkül a WACC; adóval r_U) */
  rA: number
  rD: number
  /** a tőkeáttétel: D/E */
  DperE: number
  /** csak a bővített nézetben számít */
  Tc: number
  bovitett: boolean
  /** bővített nézet: a hitel egy (D/E)* felett kockázatossá válik (szemléltető alak) */
  kockazatos: boolean
  /** (D/E)*, a kockázatossá válás küszöbe */
  kuszob: number
}

/** szem. 2: r_A = WACC = 12%, r_D = 8%, D/E = 0,25 (D/V = 0,2) → r_E = 13%; D/E = 1 → 16%. A T_C a szem. adó 4-ből. */
export const L13_ALAP: L13 = { rA: 0.12, rD: 0.08, DperE: 0.25, Tc: 0.35, bovitett: false, kockazatos: false, kuszob: 1 }

/** Az x tengely vége (D/E). */
export const L13_XMAX = 2

/**
 * SZEMLÉLTETŐ alak (nincs rá képlet a diákon, 13–16. dia): a kockázatos hitel kamata a küszöb alatt r_D, fölötte
 * folytonosan r_A felé tart: r_D + (r_A − r_D) · (1 − √((D/E)* / (D/E))). r_D mindig r_A alatt marad, és r_E (8.3) tovább nő,
 * de egyre lassabban: a (D/E) · (r_A − r_D) szorzat ~ √(D/E).
 */
export function kockazatosRD(rA: number, rD: number, DperE: number, kuszob: number): number {
  if (DperE <= kuszob) return rD
  return rD + (rA - rD) * (1 - Math.sqrt(kuszob / DperE))
}

export type Pont13 = { DperE: number; rE: number; WACC: number; rD: number }

export type L13Eredmeny =
  | { hiba: string }
  | {
      hiba: undefined
      /** a ténylegesen alkalmazott adókulcs (diás nézetben 0) */
      Tc: number
      kockazatos: boolean
      wE: number
      wD: number
      /** a hitel hozama az aktuális D/E-nél (kockázatos hitelnél magasabb r_D-nél) */
      rD: number
      rE: number
      /** diás nézetben a 8.1 (r_A), bővített nézetben a 8.8 WACC*-ja */
      WACC: number
      /** a 8.1 szerinti ellenőrzés (adó nélkül): E/V · r_E + D/V · r_D, ez r_A kell legyen */
      ellenorzes81: number
      gorbe: Pont13[]
      probak: [boolean, boolean, boolean, boolean]
    }

export function l13(s: L13): L13Eredmeny {
  if (!(s.rA > 0) || s.rA > 1) return { hiba: 'Az r_A (az eszközök hozama) 0 és 100% között lehet, és nulla nem lehet.' }
  if (s.rD < 0) return { hiba: 'Az r_D (a hitel hozama) nem lehet negatív.' }
  if (s.rD > s.rA) return { hiba: 'Az r_D nem lehet nagyobb az r_A-nál: a hitel biztosabb, ezért olcsóbb, mint az eszközök hozama.' }
  if (!(s.DperE >= 0)) return { hiba: 'A D/E nem lehet negatív.' }
  if (s.Tc < 0 || s.Tc >= 1) return { hiba: 'Az adókulcs 0 és 100% között lehet (100% nem).' }
  if (!(s.kuszob > 0)) return { hiba: 'A (D/E)* küszöb pozitív szám.' }

  const Tc = s.bovitett ? s.Tc : 0
  const kockazatos = s.bovitett && s.kockazatos
  const rDHitel = (x: number) => (kockazatos ? kockazatosRD(s.rA, s.rD, x, s.kuszob) : s.rD)
  const pont = (x: number): Pont13 => {
    const rd = rDHitel(x)
    const rE = Tc > 0 ? adosRE(s.rA, rd, x, Tc) : mmIIRE(s.rA, rd, x)
    const wE = 1 / (1 + x)
    return { DperE: x, rE, rD: rd, WACC: Tc > 0 ? modositottWacc(wE, rE, 1 - wE, rd, Tc) : tokeSzerkezetHozam([[wE, rE], [1 - wE, rd]]) }
  }
  const p = pont(s.DperE)
  const wE = 1 / (1 + s.DperE)
  const wD = 1 - wE
  const n = 80
  return {
    hiba: undefined,
    Tc,
    kockazatos,
    wE,
    wD,
    rD: p.rD,
    rE: p.rE,
    WACC: p.WACC,
    ellenorzes81: tokeSzerkezetHozam([[wE, mmIIRE(s.rA, p.rD, s.DperE)], [wD, p.rD]]),
    gorbe: Array.from({ length: n + 1 }, (_, i) => pont((i / n) * L13_XMAX)),
    probak: [
      // D/E = 1 (D = E)
      Math.abs(s.DperE - 1) < 0.005,
      // a hitel hozama eléri r_A-t: r_E nem nő tovább (az eszközök kockázatát a hitelezők viselik)
      s.rD > s.rA - 0.0005 && s.DperE > 0,
      // bővített: adó nélkül a WACC* vízszintes, r_A-n
      s.bovitett && s.Tc < 0.0005 && Math.abs(p.WACC - s.rA) < 1e-9,
      // bővített: a küszöb fölött a hitel kamata már emelkedik
      kockazatos && s.DperE > s.kuszob && p.rD > s.rD + 0.01,
    ],
  }
}
