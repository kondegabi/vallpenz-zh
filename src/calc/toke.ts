// 7. fejezet: tőkeköltség és WACC.

import { capm } from './capm.ts'
import { irr } from './npv.ts'

/** 7.1 Csapda: a tavaly fizetett D_0-ból a következő évi osztalék D_1 = D_0 (1 + g). */
export function d1(D0: number, g: number): number {
  return D0 * (1 + g)
}

/** 7.1 Gordon-modell: r_E = D_1 / P_0 + g. */
export function gordonRE(D1: number, P0: number, g: number): number {
  return D1 / P0 + g
}

/** 7.1 Gordon-modell a P_0 = D_1 / (r_E − g) alakban (g < r_E kell). */
export function gordonAr(D1: number, rE: number, g: number): number {
  if (g >= rE) throw new Error('g < r_E kell')
  return D1 / (rE - g)
}

/** 7.2 Saját tőke költsége CAPM alapon (ugyanaz, mint 5.1). */
export function capmRE(rf: number, betaE: number, MRP: number): number {
  return capm(rf, betaE, MRP)
}

/** 7.2 Ha mindkét módszer adatai adottak: a két r_E átlaga. */
export function atlagRE(rECapm: number, rEGordon: number): number {
  return (rECapm + rEGordon) / 2
}

/** 7.3 Adózás utáni hitelköltség: r_D (1 − T_C). */
export function rdAdozasUtan(rD: number, Tc: number): number {
  return rD * (1 - Tc)
}

/** 7.3 kiegészítés: a kötvény ára adott YTM mellett (éves kupon, N névérték). */
export function kotvenyAr(C: number, N: number, n: number, ytm: number): number {
  let ar = 0
  for (let t = 1; t <= n; t++) ar += C / Math.pow(1 + ytm, t)
  return ar + N / Math.pow(1 + ytm, n)
}

/** 7.3 kiegészítés: YTM = a kötvény pénzáramlásainak IRR-je (6.2). */
export function ytm(P0: number, C: number, n: number, N = 1000): number {
  const cf = [-P0, ...Array.from({ length: n }, (_, i) => (i === n - 1 ? C + N : C))]
  return irr(cf)
}

/** 7.4 Piaci értékek: E = részvények száma × árfolyam, D = névérték × jegyzési arány. */
export function piaciErtekek(reszvenyDb: number, arfolyam: number, nevertek: number, jegyzes: number) {
  const E = reszvenyDb * arfolyam
  const D = nevertek * jegyzes
  return { E, D, V: E + D }
}

/** 7.4 Súlyok piaci értékből. */
export function sulyok(E: number, D: number) {
  const V = E + D
  return { V, wE: E / V, wD: D / V }
}

/** 7.4 Súlyok D/E arányból: E/V = 1 / (1 + D/E), D/V = 1 / (1 + E/D). */
export function sulyokDEbol(DperE: number) {
  return { wE: 1 / (1 + DperE), wD: 1 / (1 + 1 / DperE) }
}

/** 7.4 WACC = E/V · r_E + D/V · r_D (1 − T_C). */
export function wacc(wE: number, rE: number, wD: number, rD: number, Tc: number): number {
  return wE * rE + wD * rdAdozasUtan(rD, Tc)
}
