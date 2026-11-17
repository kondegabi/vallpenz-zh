import { describe, expect, it } from 'vitest'
import { gordonRE } from '../toke.ts'
import {
  eps,
  felaprozottAr,
  fenntarthatoNovekedes,
  kifizetesiRata,
  osztalekModellAr,
  osztalekModellHozam,
  roe,
  tulajdoniHanyadVisszavasarlasUtan,
  ujrabefektetesiHanyad,
} from '../osztalek.ts'
import { dia } from './dia.ts'

// A 10. fejezet képletei az Osztalékpolitika diasor (forras/zh2/) képleteivel és példáival.

describe('10.1 Osztalékdiszkontálási modell', () => {
  it('az ár és a hozam alak egymás megfordítása, és ugyanaz, mint a 7.1', () => {
    const P0 = osztalekModellAr(5, 0.12, 0.04)
    expect(P0).toBeCloseTo(62.5, 10)
    expect(osztalekModellHozam(5, P0, 0.04)).toBeCloseTo(0.12, 12)
    expect(osztalekModellHozam(5, P0, 0.04)).toBeCloseTo(gordonRE(5, P0, 0.04), 12)
  })

  it('g ≥ r esetén nincs véges ár', () => {
    expect(() => osztalekModellAr(5, 0.05, 0.05)).toThrow()
  })
})

describe('10.2 Nyereség, ROE és kifizetési ráta', () => {
  it('EPS, ROE = EPS₁ / P₀, dp = DIV / EPS, újrabefektetés = 1 − dp', () => {
    expect(eps(500, 100)).toBe(5)
    expect(roe(5, 40)).toBeCloseTo(0.125, 12)
    expect(kifizetesiRata(2, 5)).toBeCloseTo(0.4, 12)
    expect(ujrabefektetesiHanyad(0.4)).toBeCloseTo(0.6, 12)
  })
})

describe('10.3 Fenntartható növekedési ütem', () => {
  it('g = ROE × (1 − dp), és a 10.1-be helyettesítve az ár', () => {
    const g = fenntarthatoNovekedes(0.15, 0.4)
    expect(g).toBeCloseTo(0.09, 12)
    expect(osztalekModellAr(2, 0.12, g)).toBeCloseTo(2 / 0.03, 9)
  })

  it('teljes kifizetésnél nincs növekedés', () => {
    expect(fenntarthatoNovekedes(0.2, 1)).toBe(0)
  })
})

describe('10.4 Részvény-visszavásárlás és felaprózás', () => {
  it('10.4 Példa (17. dia)', () => {
    dia(tulajdoniHanyadVisszavasarlasUtan(50, 100, 10), '55,6%')
    dia(tulajdoniHanyadVisszavasarlasUtan(20, 100, 10), '22,2%')
    dia(tulajdoniHanyadVisszavasarlasUtan(30 - 10, 100, 10), '22,2%')
  })

  it('10.4 Példa (22. dia)', () => {
    dia(felaprozottAr(175.56, 3), '58,52')
  })
})
