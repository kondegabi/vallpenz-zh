// Szemléltető szimulációk a leckékhez (pontfelhők, pályák). Fix seeddel, hogy a kép ne ugráljon.
// Nem pénzügyi képletek: csak a véletlen minták előállítása; a minták statisztikáit a mag
// függvényei (2.1, 3.2, 3.3, 4.2) számolják.

import { rng, type Rng } from '../lib/rng.ts'

/** Standard normális véletlen szám (Box–Muller). */
export function normalisGenerator(r: Rng): () => number {
  let tartalek: number | null = null
  return () => {
    if (tartalek !== null) {
      const v = tartalek
      tartalek = null
      return v
    }
    let u = 0
    while (u === 0) u = r.next()
    const v = r.next()
    const m = Math.sqrt(-2 * Math.log(u))
    tartalek = m * Math.sin(2 * Math.PI * v)
    return m * Math.cos(2 * Math.PI * v)
  }
}

/** n darab N(E, σ) eloszlású szám. */
export function normalisMinta(n: number, E: number, sigma: number, seed: number): number[] {
  const z = normalisGenerator(rng(seed))
  return Array.from({ length: n }, () => E + sigma * z())
}

/** n darab (x, y) pár, x ~ N(E1, σ1), y ~ N(E2, σ2), a kettő korrelációja k. */
export function korreltMinta(
  n: number,
  k: number,
  seed: number,
  o: { E1?: number; E2?: number; s1?: number; s2?: number } = {},
): [number, number][] {
  const z = normalisGenerator(rng(seed))
  const { E1 = 0, E2 = 0, s1 = 1, s2 = 1 } = o
  const m = Math.sqrt(Math.max(0, 1 - k * k))
  return Array.from({ length: n }, () => {
    const a = z()
    const b = z()
    return [E1 + s1 * a, E2 + s2 * (k * a + m * b)]
  })
}

/**
 * Egyfaktoros hozampályák (a 4.1 szerkezete: közös piaci rész + egyedi rész):
 * r_i,t = E + σ (√k · Z_t + √(1 − k) · ε_i,t). Bármely két eszköz korrelációja k, mindegyik szórása σ.
 * A portfólió az egyenlő súlyú átlag.
 */
export function egyFaktorosPalyak(o: { eszkozok: number; idoszakok: number; E: number; sigma: number; k: number; seed: number }) {
  const z = normalisGenerator(rng(o.seed))
  const k = Math.max(0, Math.min(1, o.k))
  const piac = Array.from({ length: o.idoszakok }, () => z())
  const eszkozok = Array.from({ length: o.eszkozok }, () =>
    piac.map((zt) => o.E + o.sigma * (Math.sqrt(k) * zt + Math.sqrt(1 - k) * z())),
  )
  const portfolio = piac.map((_, t) => eszkozok.reduce((s, e) => s + e[t], 0) / o.eszkozok)
  return { eszkozok, portfolio }
}
