// 3. fejezet: portfólió hozama, kovariancia, korreláció, szórás.

import { varhatoHozam } from './kockazat.ts'

/** 3.1 Portfólió várható hozama: Σ a_i E(r_i). */
export function portfolioHozam(a: number[], Er: number[]): number {
  return a.reduce((s, ai, i) => s + ai * Er[i], 0)
}

/** 3.1 „Két út ugyanarra”: a portfólió hozama állapotonként. */
export function portfolioHozamAllapotonkent(a: number[], rEszkozonkent: number[][]): number[] {
  const allapotokSzama = rEszkozonkent[0].length
  return Array.from({ length: allapotokSzama }, (_, s) =>
    a.reduce((sum, ai, i) => sum + ai * rEszkozonkent[i][s], 0),
  )
}

/** 3.2 Kovariancia állapotokból: Σ p_i (r1_i − E(r1)) (r2_i − E(r2)). */
export function kovariancia(p: number[], r1: number[], r2: number[]): number {
  const E1 = varhatoHozam(p, r1)
  const E2 = varhatoHozam(p, r2)
  return p.reduce((s, pi, i) => s + pi * (r1[i] - E1) * (r2[i] - E2), 0)
}

/** 3.3 Korreláció: cov / (σ1 σ2). */
export function korrelacio(cov: number, s1: number, s2: number): number {
  return cov / (s1 * s2)
}

/** 3.4 Kételemű portfólió varianciája kovarianciával. */
export function portfolioVarianciaCov(a1: number, a2: number, s1: number, s2: number, cov: number): number {
  return a1 * a1 * s1 * s1 + a2 * a2 * s2 * s2 + 2 * a1 * a2 * cov
}

/** 3.4 Kételemű portfólió varianciája korrelációval. */
export function portfolioVarianciaKorr(a1: number, a2: number, s1: number, s2: number, k: number): number {
  return portfolioVarianciaCov(a1, a2, s1, s2, k * s1 * s2)
}

/** 3.1 + 3.4: a kételemű portfólió (E, σ) pontjai a súly mentén, a₁ ∈ [0, 1]. */
export function portfolioGorbe(E1: number, E2: number, s1: number, s2: number, k: number, lepesek = 100) {
  return Array.from({ length: lepesek + 1 }, (_, i) => {
    const a1 = i / lepesek
    return {
      a1,
      E: portfolioHozam([a1, 1 - a1], [E1, E2]),
      szoras: Math.sqrt(Math.max(0, portfolioVarianciaKorr(a1, 1 - a1, s1, s2, k))),
    }
  })
}

/**
 * Levezetés a 3.4-ből: a σ²(r_P) a₁ szerinti deriváltja nulla, ha
 * a₁ = (σ₂² − kσ₁σ₂) / (σ₁² + σ₂² − 2kσ₁σ₂). Ez a minimális szórású súly (a dián az „A” pont).
 * k = −1-nél a₁ = σ₂ / (σ₁ + σ₂), a képlettár példájában 0,45 / 0,55 = 81,8%.
 */
export function minVarianciaSuly(s1: number, s2: number, k: number): number {
  const nevezo = s1 * s1 + s2 * s2 - 2 * k * s1 * s2
  if (nevezo === 0) return 0.5
  return (s2 * s2 - k * s1 * s2) / nevezo
}

/**
 * A 3. ea 12. diájának B₃ pontja két eszközre: egy nem hatékony (az „A” alatti ágon lévő)
 * portfólióhoz az azonos szórású, nagyobb várható hozamú portfólió a hatékony ágon. Felezéssel
 * keresi a 3.4 szerinti szórásra; ha a választott pont hatékony, vagy nincs ilyen pont, null.
 */
export function azonosSzorasuHatekony(a1: number, E1: number, E2: number, s1: number, s2: number, k: number) {
  const pont = (a: number) => ({
    a1: a,
    E: portfolioHozam([a, 1 - a], [E1, E2]),
    szoras: Math.sqrt(Math.max(0, portfolioVarianciaKorr(a, 1 - a, s1, s2, k))),
  })
  const aMin = Math.min(1, Math.max(0, minVarianciaSuly(s1, s2, k)))
  const min = pont(aMin)
  const sajat = pont(a1)
  if (sajat.E >= min.E - 1e-12) return null
  // a hatékony ág a nagyobb hozamú eszköz felé esik
  const veg = E1 >= E2 ? 1 : 0
  const cel = sajat.szoras
  if (cel > pont(veg).szoras + 1e-12) return null
  let lo = aMin
  let hi = veg
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2
    if (pont(m).szoras < cel) lo = m
    else hi = m
  }
  return pont((lo + hi) / 2)
}

/**
 * 3.5 tőkepiaci egyenes: az r_f-ből a kételemű görbéhez húzott érintő érintési pontja, vagyis a görbe
 * (0 ≤ a₁ ≤ 1) azon pontja, ahol (E − r_f)/σ a legnagyobb (levezetés: a 3.5 CML-definíciójából).
 * Sűrű rácson keres, majd aranymetszéssel finomít.
 */
export function erintesiPortfolio(E1: number, E2: number, s1: number, s2: number, k: number, rf: number) {
  const pont = (a: number) => {
    const E = portfolioHozam([a, 1 - a], [E1, E2])
    const szoras = Math.sqrt(Math.max(0, portfolioVarianciaKorr(a, 1 - a, s1, s2, k)))
    return { a1: a, E, szoras, meredekseg: szoras > 0 ? (E - rf) / szoras : -Infinity }
  }
  let legjobb = 0
  for (let i = 1; i <= 1000; i++) if (pont(i / 1000).meredekseg > pont(legjobb / 1000).meredekseg) legjobb = i
  let lo = Math.max(0, (legjobb - 1) / 1000)
  let hi = Math.min(1, (legjobb + 1) / 1000)
  const g = (Math.sqrt(5) - 1) / 2
  for (let i = 0; i < 60; i++) {
    const c = hi - g * (hi - lo)
    const d = lo + g * (hi - lo)
    if (pont(c).meredekseg > pont(d).meredekseg) hi = d
    else lo = c
  }
  return pont((lo + hi) / 2)
}

/**
 * 3.5 egyenlő súlyokkal (a_i = 1/n), egyforma σ-val és minden párra azonos k-val:
 * σ²(r_P) = σ²/n + (1 − 1/n)·k·σ² (levezetés a 3.5 képletéből: n tag a²σ², n(n − 1) tag a²kσ²).
 */
export function egyenloSulyuVariancia(n: number, sigma: number, k: number): number {
  return (sigma * sigma) / n + (1 - 1 / n) * k * sigma * sigma
}

/** Az egyenlő súlyú portfólió szórása n → ∞ esetén: σ·√k (a nem diverzifikálható szint; levezetés: 3.5). */
export function nemDiverzifikalhatoSzint(sigma: number, k: number): number {
  return sigma * Math.sqrt(k)
}

/** Az egyenlősúlyú képlet megfordítva: mekkora átlagos k mellett lesz n elemnél a szórás σ_n. */
export function atlagosKorrelacio(n: number, sigma: number, sigmaN: number): number {
  return (sigmaN * sigmaN - (sigma * sigma) / n) / ((1 - 1 / n) * sigma * sigma)
}

/** 3.5 n elemű portfólió varianciája: Σ a_i² σ_i² + Σ_{i≠j} a_i a_j k_ij σ_i σ_j. */
export function portfolioVarianciaN(a: number[], s: number[], k: number[][]): number {
  let v = 0
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length; j++) {
      v += i === j ? a[i] * a[i] * s[i] * s[i] : a[i] * a[j] * k[i][j] * s[i] * s[j]
    }
  }
  return v
}
