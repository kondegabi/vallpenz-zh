import { describe, expect, it } from 'vitest'
import { normalisSuruseg, szoras, varhatoHozam } from '../kockazat.ts'
import { korrelacio, kovariancia } from '../portfolio.ts'
import { egyFaktorosPalyak, korreltMinta, normalisMinta } from '../szimulacio.ts'

// A minták statisztikáit a mag függvényei számolják, egyenlő valószínűségekkel.
const egyenlo = (n: number) => Array.from({ length: n }, () => 1 / n)

describe('Szemléltető szimuláció', () => {
  it('a normális minta várható értéke és szórása a megadott', () => {
    const x = normalisMinta(5000, 0.12, 0.198, 7)
    const p = egyenlo(x.length)
    expect(varhatoHozam(p, x)).toBeCloseTo(0.12, 1)
    expect(Math.abs(szoras(p, x) - 0.198)).toBeLessThan(0.01)
  })

  it('ugyanabból a seedből ugyanaz a minta', () => {
    expect(normalisMinta(10, 0, 1, 42)).toEqual(normalisMinta(10, 0, 1, 42))
    expect(normalisMinta(10, 0, 1, 42)).not.toEqual(normalisMinta(10, 0, 1, 43))
  })

  it.each([-1, -0.5, 0, 0.6, 1])('a korrelált minta korrelációja ≈ %s', (k) => {
    const par = korreltMinta(4000, k, 3, { s1: 0.1, s2: 0.45 })
    const x = par.map((v) => v[0])
    const y = par.map((v) => v[1])
    const p = egyenlo(par.length)
    const becsult = korrelacio(kovariancia(p, x, y), szoras(p, x), szoras(p, y))
    expect(Math.abs(becsult - k)).toBeLessThan(0.05)
  })

  it('az egyfaktoros pályák páronkénti korrelációja ≈ k, és az átlag kevésbé ingadozik', () => {
    const { eszkozok, portfolio } = egyFaktorosPalyak({ eszkozok: 50, idoszakok: 3000, E: 0, sigma: 0.425, k: 0.6, seed: 5 })
    const p = egyenlo(portfolio.length)
    const k01 = korrelacio(kovariancia(p, eszkozok[0], eszkozok[1]), szoras(p, eszkozok[0]), szoras(p, eszkozok[1]))
    expect(Math.abs(k01 - 0.6)).toBeLessThan(0.05)
    expect(szoras(p, portfolio)).toBeLessThan(szoras(p, eszkozok[0]))
  })
})

describe('Normális sűrűség (szemléltető)', () => {
  it('a csúcs 1 / (σ√2π), és a görbe alatti terület ≈ 1', () => {
    expect(normalisSuruseg(0.12, 0.12, 0.198)).toBeCloseTo(1 / (0.198 * Math.sqrt(2 * Math.PI)), 10)
    let terulet = 0
    for (let x = -1; x <= 1.24; x += 0.001) terulet += normalisSuruseg(x, 0.12, 0.198) * 0.001
    expect(terulet).toBeCloseTo(1, 3)
  })
})
