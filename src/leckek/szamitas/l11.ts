// 11. lecke: a WACC összetétele (7.3–7.4). Csak a mag függvényeit hívja.

import { capmRE, piaciErtekek, rdAdozasUtan, sulyok, wacc } from '../../calc/toke.ts'

export type Eset = '5ea' | 'video'
export type L11 = { eset: Eset; wE: number; rE: number; rD: number; Tc: number }

const s5 = sulyok(piaciErtekek(1.4e6, 20, 5e6, 0.93).E, piaciErtekek(1.4e6, 20, 5e6, 0.93).D)
const sV = sulyok(piaciErtekek(2e6, 10, 6e6, 0.9).E, piaciErtekek(2e6, 10, 6e6, 0.9).D)

/** 7.4 példa (5. ea), teljes lánc: E/V = 0,8576, r_E = 13,18%, r_D = 11%, T_C = 21% → WACC = 12,54%. */
export const L11_5EA: L11 = { eset: '5ea', wE: s5.wE, rE: capmRE(0.08, 0.74, 0.07), rD: 0.11, Tc: 0.21 }
/** 7.4 példa (videó): E/V = 0,7874, r_E = 12,4%, r_D = 8%, T_C = 20% → WACC = 11,1%. */
export const L11_VIDEO: L11 = { eset: 'video', wE: sV.wE, rE: capmRE(0.04, 1.2, 0.07), rD: 0.08, Tc: 0.2 }
export const L11_ALAP = L11_5EA

export type L11Eredmeny =
  | { hiba: string }
  | {
      hiba: undefined
      wD: number
      rDu: number
      /** a két tag: E/V · r_E és D/V · r_D (1 − T_C) */
      tagE: number
      tagD: number
      WACC: number
      /** ugyanez adópajzs nélkül (T_C = 0) */
      waccAdoNelkul: number
      /** az adópajzs hatása: a két WACC különbsége */
      adopajzs: number
      /** WACC az E/V függvényében (a többi bemenet változatlan) */
      gorbe: [number, number][]
      gorbeAdoNelkul: [number, number][]
      probak: [boolean, boolean, boolean]
    }

export function l11(s: L11): L11Eredmeny {
  if (s.wE < 0 || s.wE > 1) return { hiba: 'Az E/V súly 0 és 100% között lehet.' }
  if (s.Tc < 0 || s.Tc >= 1) return { hiba: 'Az adókulcs 0 és 100% között lehet.' }
  const wD = 1 - s.wE
  const rDu = rdAdozasUtan(s.rD, s.Tc)
  const W = wacc(s.wE, s.rE, wD, s.rD, s.Tc)
  const W0 = wacc(s.wE, s.rE, wD, s.rD, 0)
  const pontok = (Tc: number) => Array.from({ length: 101 }, (_, i) => [i / 100, wacc(i / 100, s.rE, 1 - i / 100, s.rD, Tc)] as [number, number])
  const alap5 = s.eset === '5ea' && Math.abs(s.rE - L11_5EA.rE) < 1e-9 && Math.abs(s.rD - L11_5EA.rD) < 1e-9
  return {
    hiba: undefined,
    wD,
    rDu,
    tagE: s.wE * s.rE,
    tagD: wD * rDu,
    WACC: W,
    waccAdoNelkul: W0,
    adopajzs: W0 - W,
    gorbe: pontok(s.Tc),
    gorbeAdoNelkul: pontok(0),
    probak: [
      alap5 && Math.abs(s.wE - L11_5EA.wE) < 1e-9 && s.Tc < 0.0005,
      alap5 && Math.abs(s.Tc - L11_5EA.Tc) < 1e-9 && Math.abs(W - 0.12) < 0.0005,
      s.wE > 0.9995,
    ],
  }
}
