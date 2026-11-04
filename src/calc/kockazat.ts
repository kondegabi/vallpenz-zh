// 2. fejezet: várható hozam és szórás.

import { szamtaniAtlag } from './hozam.ts'

function osszeg(x: number[]): number {
  return x.reduce((s, v) => s + v, 0)
}

/** 2.1 Várható hozam állapotokból: E(r) = Σ p_i r_i. */
export function varhatoHozam(p: number[], r: number[]): number {
  return osszeg(p.map((pi, i) => pi * r[i]))
}

/** 2.1 Kockázati prémium: E(r) − r_f. */
export function kockazatiPremium(Er: number, rf: number): number {
  return Er - rf
}

/** 2.2 A dia kidolgozó táblázatának sorai: (1) valósz., (2) r, (3) r − E(r), (4) a négyzete, (1) × (4). */
export function varianciaLevezetes(p: number[], r: number[]) {
  const Er = varhatoHozam(p, r)
  const sorok = p.map((pi, i) => {
    const elteres = r[i] - Er
    const negyzet = elteres * elteres
    return { p: pi, r: r[i], elteres, negyzet, sulyozott: pi * negyzet }
  })
  const variancia = osszeg(sorok.map((s) => s.sulyozott))
  return { Er, sorok, variancia, szoras: Math.sqrt(variancia) }
}

/** 2.2 Variancia állapotokból: σ² = Σ p_i (r_i − E(r))². */
export function variancia(p: number[], r: number[]): number {
  return varianciaLevezetes(p, r).variancia
}

/** 2.2 Szórás állapotokból. */
export function szoras(p: number[], r: number[]): number {
  return Math.sqrt(variancia(p, r))
}

/** 2.3 Historikus variancia: az eltérésnégyzetek összege osztva N − 1-gyel. */
export function historikusLevezetes(r: number[]) {
  const atlag = szamtaniAtlag(r)
  const negyzetosszeg = osszeg(r.map((x) => (x - atlag) ** 2))
  const variancia = negyzetosszeg / (r.length - 1)
  return { atlag, negyzetosszeg, variancia, szoras: Math.sqrt(variancia) }
}

/**
 * A normális eloszlás sűrűségfüggvénye. A képlettárban nincs benne; csak a 2.4 haranggörbéjének
 * kirajzolásához kell (jóváhagyva, „szemléltető”). A sávok feliratai a 2.4 „kb.” értékei maradnak.
 */
export function normalisSuruseg(x: number, E: number, sigma: number): number {
  const z = (x - E) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

/** 2.4 Szigma-sáv: [E(r) − kσ, E(r) + kσ]. */
export function szigmaSav(Er: number, sigma: number, k: 1 | 2 | 3): [number, number] {
  return [Er - k * sigma, Er + k * sigma]
}
