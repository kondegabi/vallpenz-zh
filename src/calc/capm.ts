// 5. fejezet: CAPM és az értékpapírpiaci egyenes (SML).

/** 5.1 Piaci kockázati prémium: E(r_M) − r_f. */
export function mrp(ErM: number, rf: number): number {
  return ErM - rf
}

/** 5.1 CAPM: E(r) = r_f + β · MRP. */
export function capm(rf: number, beta: number, MRP: number): number {
  return rf + beta * MRP
}

/** 5.1 átrendezve β-ra: β = (E(r) − r_f) / MRP. */
export function betaVissza(Er: number, rf: number, MRP: number): number {
  return (Er - rf) / MRP
}

/** 5.1 átrendezve r_f-re, ha E(r_M) adott: E(r) = r_f + β (E(r_M) − r_f) → r_f = (E(r) − β E(r_M)) / (1 − β). */
export function rfVisszaErMbol(Er: number, beta: number, ErM: number): number {
  if (beta === 1) throw new Error('β = 1 esetén r_f nem határozható meg')
  return (Er - beta * ErM) / (1 - beta)
}

/** 5.1 átrendezve r_f-re, ha MRP adott (a csapda másik oldala): r_f = E(r) − β · MRP. */
export function rfVisszaMRPbol(Er: number, beta: number, MRP: number): number {
  return Er - beta * MRP
}

/** 5.1 átrendezve MRP-re: MRP = (E(r) − r_f) / β. */
export function mrpVissza(Er: number, rf: number, beta: number): number {
  return (Er - rf) / beta
}

/** 5.2 Egy eszköz meredeksége (Treynor-arány): (E(r) − r_f) / β. */
export function meredekseg(Er: number, rf: number, beta: number): number {
  return (Er - rf) / beta
}

export type Arazas = 'alulárazott' | 'túlárazott' | 'helyesen árazott'

/** 5.2 Alá/fölé árazott: a várható hozam a CAPM szerinti fölött → alulárazott, alatta → túlárazott. */
export function arazas(Er: number, rf: number, beta: number, MRP: number, tures = 1e-9): Arazas {
  const elvart = capm(rf, beta, MRP)
  if (Er > elvart + tures) return 'alulárazott'
  if (Er < elvart - tures) return 'túlárazott'
  return 'helyesen árazott'
}

/** 5.3 Két helyesen árazott eszköz: (E_A − r_f)/β_A = (E_B − r_f)/β_B → r_f. */
export function rfKetEszkozbol(EA: number, betaA: number, EB: number, betaB: number): number {
  if (betaA === betaB) throw new Error('Azonos bétáknál r_f nem határozható meg')
  return (betaB * EA - betaA * EB) / (betaB - betaA)
}

/** 5.3 Rokon típus: a két CAPM-egyenletet kivonva ΔE = Δβ · MRP → MRP = ΔE / Δβ. */
export function mrpBetaKulonbsegbol(deltaE: number, deltaBeta: number): number {
  return deltaE / deltaBeta
}

/** 5.4 Kockázatos (A) + kockázatmentes portfólió: hozam és béta. */
export function kevertPortfolio(w: number, EA: number, betaA: number, rf: number) {
  return { Er: w * EA + (1 - w) * rf, beta: w * betaA }
}

/**
 * 5.4 keverék szórása: σ(r_P) = w·σ(r_A). Levezetés a 3.4 képletéből: a kockázatmentes rész
 * szórása 0, a kovariancia vele 0, így csak a w²σ²(r_A) tag marad.
 */
export function kevertSzoras(w: number, sigmaA: number): number {
  return Math.abs(w) * sigmaA
}

/** 5.4 Súly visszafejtése cél várható hozamhoz: E(r_P) = w E(r_A) + (1 − w) r_f → w. */
export function sulyCelHozamhoz(celEr: number, EA: number, rf: number): number {
  return (celEr - rf) / (EA - rf)
}
