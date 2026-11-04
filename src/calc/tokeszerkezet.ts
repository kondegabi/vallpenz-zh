// 8. fejezet: tőkeszerkezet (MM-tételek, adómegtakarítás, módosított tőkeköltség).

import { rdAdozasUtan } from './toke.ts'

/** 8.1 A források hozamának súlyozott átlaga: [súly, hozam] párok (r_A = r_V = WACC tökéletes piacon). */
export function tokeSzerkezetHozam(forrasok: [suly: number, hozam: number][]): number {
  return forrasok.reduce((s, [w, r]) => s + w * r, 0)
}

/** 8.2 Az eszközök bétája: β_A = E/V · β_E + D/V · β_D. */
export function eszkozBeta(wE: number, betaE: number, wD: number, betaD: number): number {
  return wE * betaE + wD * betaD
}

/** 8.2 A hitel bétája a CAPM-ből: β_D = (r_D − r_f) / MRP. */
export function hitelBeta(rD: number, rf: number, MRP: number): number {
  return (rD - rf) / MRP
}

/** 8.3 MM II. tétel: r_E = r_A + D/E · (r_A − r_D). */
export function mmIIRE(rA: number, rD: number, DperE: number): number {
  return rA + DperE * (rA - rD)
}

/** 8.4 Éves adómegtakarítás: TS = T_C · D · r_D. */
export function adomegtakaritasEves(Tc: number, D: number, rD: number): number {
  return Tc * D * rD
}

/** 8.4 Az adómegtakarítás jelenértéke örökjáradékként, r_D-vel diszkontálva: PV(TS) = T_C · D. */
export function adomegtakaritasPvOrok(Tc: number, D: number): number {
  return Tc * D
}

/** 8.5 Véges futamidő: az évenkénti T_C · kamat jelenértéke, r_D-vel diszkontálva. */
export function adomegtakaritasPvVeges(Tc: number, kamatok: number[], rD: number): number {
  return kamatok.reduce((s, k, i) => s + (Tc * k) / Math.pow(1 + rD, i + 1), 0)
}

/** 8.5 Egyenlő tőketörlesztésű hitel évenkénti kamatai (a kamat az év eleji tartozás után jár). */
export function egyenloTorlesztesKamatai(D: number, n: number, rD: number): number[] {
  return Array.from({ length: n }, (_, i) => (D * (n - i) * rD) / n)
}

/** 8.6 Vállalatérték adóval: V_L = V_U + T_C · D. */
export function vallalatertekAdoval(VU: number, Tc: number, D: number): number {
  return VU + Tc * D
}

/** 8.7 A saját tőke költsége adóval: r_E = r_U + D/E · (r_U − r_D) · (1 − T_C). */
export function adosRE(rU: number, rD: number, DperE: number, Tc: number): number {
  return rU + DperE * (rU - rD) * (1 - Tc)
}

/** 8.8 Módosított WACC: WACC* = E/V · r_E + D/V · r_D · (1 − T_C). */
export function modositottWacc(wE: number, rE: number, wD: number, rD: number, Tc: number): number {
  return wE * rE + wD * rdAdozasUtan(rD, Tc)
}

/** 8.9 Relatív adóelőny csak társasági adóval: T* = 1 − (1 − T_C) = T_C. */
export function relativAdoelony(Tc: number): number {
  return 1 - (1 - Tc)
}

/** 8.10 Választásos elmélet: V = V_U + PV(adómegtakarítás) − PV(pénzügyi nehézségek). */
export function valasztosErtek(VU: number, pvAdomegtakaritas: number, pvNehezsegek: number): number {
  return VU + pvAdomegtakaritas - pvNehezsegek
}
