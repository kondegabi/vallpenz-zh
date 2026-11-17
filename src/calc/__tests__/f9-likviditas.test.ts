import { describe, expect, it } from 'vitest'
import { atlagosPenzallomanyBaumol, atlagosPenzallomanyMillerOrr, baumolC, baumolL, millerOrrC, millerOrrU } from '../likviditas.ts'
import { dia } from './dia.ts'

// A 9. fejezet képletei a Készpénz- és likviditásmenedzsment diasor (forras/zh2/) példáival.

describe('9.1 Baumol–Allais–Tobin-modell', () => {
  it('9.1 Példa (13. dia)', () => {
    const T = 365 * 100
    dia(baumolC(T, 10, 0.05), '3821')
    // a dia levágja: 0,1047 → 0,104 (kerekítve 0,105 lenne)
    dia(baumolL(T, 10, 0.05), '0,104', 0.001)
    dia(baumolL(T, 10, 0.05) * 365, '38,2')
    // a két képlet összefügg: L = C / T
    expect(baumolL(T, 10, 0.05)).toBeCloseTo(baumolC(T, 10, 0.05) / T, 12)
  })

  it('9.1 az átlagos pénzállomány C / 2 (12. dia ábrája: 1 200 000 → 600 000)', () => {
    expect(atlagosPenzallomanyBaumol(1_200_000)).toBe(600_000)
  })
})

describe('9.2 Miller–Orr-modell', () => {
  it('9.2 Példa (17. dia)', () => {
    const C = millerOrrC(100, 10, 200, 0.01)
    dia(C, '411')
    // a dia a kerekítetlen C*-ból (410,7) kapja az 1032-t; 411-gyel 1033 lenne
    dia(millerOrrU(C, 100), '1032')
    dia(atlagosPenzallomanyMillerOrr(C, 100), '514')
  })

  it('9.2 Példa (16. dia)', () => {
    // a napi kamat kamatos átváltással: (1,0225)^(1/365) − 1 = 0,0060962%; C* = 600 616,6, a dia lefelé kerekít,
    // és a felső korlátot a kerekített célértékből számolja
    const r = Math.pow(1.0225, 1 / 365) - 1
    dia(r * 100, '0,0060962')
    const C = millerOrrC(350_000, 10, 357_697, r)
    dia(C, '600616', 1)
    dia(millerOrrU(600_616, 350_000), '1101848')
  })

  it('a felső korlát két alakja ugyanaz: 3C* − 2L = L + 3(C* − L)', () => {
    expect(millerOrrU(500, 100)).toBe(100 + 3 * (500 - 100))
  })
})
