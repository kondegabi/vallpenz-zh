import { describe, expect, it } from 'vitest'
import { szoras, varhatoHozam } from '../kockazat.ts'
import {
  atlagosKorrelacio,
  azonosSzorasuHatekony,
  egyenloSulyuVariancia,
  erintesiPortfolio,
  nemDiverzifikalhatoSzint,
  korrelacio,
  kovariancia,
  minVarianciaSuly,
  portfolioHozam,
  portfolioGorbe,
  portfolioHozamAllapotonkent,
  portfolioVarianciaCov,
  portfolioVarianciaKorr,
  portfolioVarianciaN,
} from '../portfolio.ts'
import { dia } from './dia.ts'

// A 2.1, a 3.3 és a 3.4 „Kockázatmentes portfólió” példája ugyanaz az adatsor (a 0. fázisban jóváhagyva).
const p = [0.5, 0.5]
const rA = [0.1, 0.3]
const rB = [0.7, -0.2]

describe('3. Portfólió', () => {
  it('3.1 Példa (2. ea)', () => {
    // 60% A (15%) + 40% B (10%)
    dia(portfolioHozam([0.6, 0.4], [0.15, 0.1]), '13%')
  })

  it('3.1 Két út ugyanarra', () => {
    // állapotonkénti portfóliohozam várható értéke = a várható hozamok súlyozott átlaga
    const a = [0.6, 0.4]
    const allapotonkent = portfolioHozamAllapotonkent(a, [rA, rB])
    const egyikUt = varhatoHozam(p, allapotonkent)
    const masikUt = portfolioHozam(a, [varhatoHozam(p, rA), varhatoHozam(p, rB)])
    expect(egyikUt).toBeCloseTo(masikUt, 12)
  })

  it('3.3 Példa (2. ea)', () => {
    // cov(rA, rB) = −0,045, σA = 10%, σB = 45% → k = −1
    dia(korrelacio(-0.045, 0.1, 0.45), '−1', 1e-12)
  })

  it('3.2 → 3.3 a 2.1 példa állapotaiból (2. ea)', () => {
    const sA = szoras(p, rA)
    const sB = szoras(p, rB)
    dia(sA, '10%')
    dia(sB, '45%')
    // a dia hibája (19. dia): σ²(rA) = 0,001 helyett 0,01
    dia(sA * sA, '0,01')
    const cov = kovariancia(p, rA, rB)
    dia(cov, '−0,045', 1e-12)
    dia(korrelacio(cov, sA, sB), '−1', 1e-12)
  })

  it('3.4 Példa (2. ea) #1', () => {
    // 50% / 50%, σ = 35% és 50%, k = 0,6
    const v = portfolioVarianciaKorr(0.5, 0.5, 0.35, 0.5, 0.6)
    // a dia hibája (14. dia): a táblázatban 0,30625 helyett 0,030625
    dia(0.5 * 0.5 * 0.35 * 0.35, '0,030625')
    dia(v, '0,145625')
    dia(Math.sqrt(v), '38,2%')
  })

  it('3.4 Példa (2. ea) #2', () => {
    // 60% / 40%, σ² = 0,0585 és 0,011, cov = −0,001
    const v = portfolioVarianciaCov(0.6, 0.4, Math.sqrt(0.0585), Math.sqrt(0.011), -0.001)
    dia(v, '0,02234')
    dia(Math.sqrt(v), '14,9%')
  })

  it('3.4 Kockázatmentes portfólió (2. ea)', () => {
    // k = −1, 81,8% A + 18,2% B → minden állapotban 20,9%, σ = 0
    const a = [0.818, 0.182]
    const allapotonkent = portfolioHozamAllapotonkent(a, [rA, rB])
    dia(allapotonkent[0], '20,9%')
    dia(allapotonkent[1], '20,9%')
    dia(portfolioHozam(a, [0.2, 0.25]), '20,9%')
    const v = portfolioVarianciaKorr(a[0], a[1], 0.1, 0.45, -1)
    dia(Math.sqrt(v), '0%', 0.0005)
  })

  it('3.4 a két alak egyezik (cov = k σ1 σ2)', () => {
    const k = 0.6
    expect(portfolioVarianciaKorr(0.5, 0.5, 0.35, 0.5, k)).toBeCloseTo(
      portfolioVarianciaCov(0.5, 0.5, 0.35, 0.5, k * 0.35 * 0.5),
      12,
    )
  })

  it('3.4 levezetés: a minimális szórású súly k = −1-nél a dia 81,8%-a', () => {
    const a = minVarianciaSuly(0.1, 0.45, -1)
    dia(a, '81,8%')
    dia(Math.sqrt(portfolioVarianciaKorr(a, 1 - a, 0.1, 0.45, -1)), '0', 1e-9)
    // bármely más súlynál nagyobb a szórás
    for (const b of [0.7, 0.8, 0.85, 0.9]) {
      expect(portfolioVarianciaKorr(b, 1 - b, 0.35, 0.5, 0.6)).toBeGreaterThanOrEqual(
        portfolioVarianciaKorr(minVarianciaSuly(0.35, 0.5, 0.6), 1 - minVarianciaSuly(0.35, 0.5, 0.6), 0.35, 0.5, 0.6) - 1e-12,
      )
    }
  })

  it('3.1 + 3.4 görbe: a két végpont a két eszköz, 50%-nál a 2. ea 19. diája (17,5%)', () => {
    const g = portfolioGorbe(0.2, 0.25, 0.1, 0.45, -1, 100)
    expect(g[0]).toMatchObject({ a1: 0, E: 0.25 })
    dia(g[0].szoras, '45%')
    dia(g[100].szoras, '10%')
    dia(g[50].szoras, '17,5%')
    dia(g[50].E, '22,5%')
  })

  it('3. ea 12. dia, B₃: az alsó ágon lévő ponthoz az azonos szórású hatékony pont', () => {
    // k = −1: a = 0,9 → σ = 0,9 × 0,1 − 0,1 × 0,45 = 0,045, E = 20,5% (az A pont 20,9%-a alatt)
    const b3 = azonosSzorasuHatekony(0.9, 0.2, 0.25, 0.1, 0.45, -1)!
    expect(b3.szoras).toBeCloseTo(0.045, 9)
    expect(b3.a1).toBeCloseTo(0.405 / 0.55, 6)
    expect(b3.E).toBeGreaterThan(0.209)
    // a hatékony ágon lévő pontnak nincs ilyen párja
    expect(azonosSzorasuHatekony(0.5, 0.2, 0.25, 0.1, 0.45, -1)).toBeNull()
  })

  it('3.5 két elemre ugyanazt adja, mint 3.4', () => {
    const vN = portfolioVarianciaN([0.5, 0.5], [0.35, 0.5], [
      [1, 0.6],
      [0.6, 1],
    ])
    dia(vN, '0,145625')
  })

  it('3.5 egyenlő súlyokkal és egyforma σ, k mellett ugyanazt adja, mint az általános képlet', () => {
    const n = 5
    const k = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0.3)))
    const altalanos = portfolioVarianciaN(Array(n).fill(1 / n), Array(n).fill(0.4), k)
    expect(egyenloSulyuVariancia(n, 0.4, 0.3)).toBeCloseTo(altalanos, 12)
    // n → ∞: σ√k
    expect(Math.sqrt(egyenloSulyuVariancia(1e9, 0.4, 0.3))).toBeCloseTo(nemDiverzifikalhatoSzint(0.4, 0.3), 6)
  })

  it('3.5 Példa (3. ea)', () => {
    // Ross 13.7: σ = 49,24%; az 1000 elemű portfólió 19,21%-ából az átlagos korreláció ≈ 0,151.
    // Ezzel a képlet a táblázat minden sorát 0,01 százalékponton belül visszaadja.
    const k = atlagosKorrelacio(1000, 0.4924, 0.1921)
    expect(k).toBeCloseTo(0.1514, 4)
    const sz = (n: number) => Math.sqrt(egyenloSulyuVariancia(n, 0.4924, k))
    dia(sz(10), '23,93%')
    dia(sz(1000), '19,21%')
    const tabla: [number, number][] = [
      [2, 0.3736], [4, 0.2969], [6, 0.2664], [8, 0.2498], [20, 0.2168], [30, 0.2087], [40, 0.2046],
      [50, 0.202], [100, 0.1969], [200, 0.1942], [300, 0.1934], [400, 0.1929], [500, 0.1927],
    ]
    for (const [n, v] of tabla) expect(Math.abs(sz(n) - v), `n = ${n}`).toBeLessThan(1e-4)
    dia(nemDiverzifikalhatoSzint(0.4924, k), '19,2%')
  })
})

describe('3.5 tőkepiaci egyenes', () => {
  it('az érintési pont meredeksége a görbe minden pontjáénál nagyobb, és egyezik a kételemű zárt alakkal', () => {
    const [E1, E2, s1, s2, k, rf] = [0.2, 0.25, 0.1, 0.45, 0, 0.08]
    const m = erintesiPortfolio(E1, E2, s1, s2, k, rf)
    for (let i = 0; i <= 100; i++) {
      const a = i / 100
      const E = portfolioHozam([a, 1 - a], [E1, E2])
      const s = Math.sqrt(portfolioVarianciaKorr(a, 1 - a, s1, s2, k))
      expect((E - rf) / s).toBeLessThanOrEqual(m.meredekseg + 1e-12)
    }
    // ellenőrzés a kételemű érintési súly ismert zárt alakjával (k = 0-ra)
    const x1 = E1 - rf
    const x2 = E2 - rf
    const zart = (x1 * s2 * s2 - x2 * k * s1 * s2) / (x1 * s2 * s2 + x2 * s1 * s1 - (x1 + x2) * k * s1 * s2)
    expect(m.a1).toBeCloseTo(zart, 6)
  })
})
