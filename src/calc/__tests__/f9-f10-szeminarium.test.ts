import { describe, expect, it } from 'vitest'
import { baumolC, millerOrrC, millerOrrU } from '../likviditas.ts'
import { alaptoke, exDividendAr, felaprozottAr, fenntarthatoNovekedes, kibocsatandoDarab, ketszakaszosAr, osztalekModellAr } from '../osztalek.ts'
import { dia } from './dia.ts'

// A 9–10. fejezet szemináriumi feladatai (forras/zh2/: VPÜ2 cash_examples_hu.pdf, VPÜ2 Div examples_hu.pdf).
// A feladatsorok megoldás nélküliek: a várt értékek saját számítások, a feladat adataiból a képlettár képleteivel.

describe('9.1 Baumol–Allais–Tobin, szeminárium', () => {
  it('9.1 Példa (szem. Baumol 1)', () => {
    // napi 200 ezer USD, APR 5%, F = 500; napi kamattal lineárisan számolva ugyanaz, mint éves T-vel
    const napi = baumolC(200_000, 500, 0.05 / 365)
    dia(napi, '1208305')
    expect(napi).toBeCloseTo(baumolC(200_000 * 365, 500, 0.05), 6)
    dia(napi / 200_000, '6,04')
  })

  it('9.1 Példa (szem. Baumol 2)', () => {
    const C = baumolC(50_000, 100, 0.02 / 365)
    dia(C, '427200')
    dia(C / 50_000, '8,54')
  })

  it('9.1 a paraméterek hatása (szem. Baumol 1b): T, F növelése C-t növeli, r növelése csökkenti', () => {
    const alap = baumolC(200_000, 500, 0.05 / 365)
    expect(baumolC(220_000, 500, 0.05 / 365)).toBeGreaterThan(alap)
    expect(baumolC(200_000, 600, 0.05 / 365)).toBeGreaterThan(alap)
    expect(baumolC(200_000, 500, 0.06 / 365)).toBeLessThan(alap)
    // az időköz (C / napi összeg) T növelésével csökken, F növelésével nő, r növelésével csökken
    const nap = (d: number, F: number, r: number) => baumolC(d, F, r / 365) / d
    expect(nap(220_000, 500, 0.05)).toBeLessThan(nap(200_000, 500, 0.05))
    expect(nap(200_000, 600, 0.05)).toBeGreaterThan(nap(200_000, 500, 0.05))
    expect(nap(200_000, 500, 0.06)).toBeLessThan(nap(200_000, 500, 0.05))
  })
})

describe('9.2 Miller–Orr, szeminárium', () => {
  it('9.2 Példa (szem. Miller–Orr 1)', () => {
    // napi σ = 10 000, L = 3σ, napi r = 5% / 365, F = 500
    const C = millerOrrC(30_000, 500, 10_000, 0.05 / 365)
    dia(C, '94931')
    dia(millerOrrU(C, 30_000), '224793')
  })

  it('9.2 Példa (szem. Miller–Orr 2)', () => {
    // a 890 ezer a σ (a feladat „varianciát” ír, de a szám a σ, és csak ez kerül négyzetre), napi r = 4% / 365,
    // L = 160 000, F = 300
    const C = millerOrrC(160_000, 300, 890_000, 0.04 / 365)
    dia(C, '1335976')
    dia(millerOrrU(C, 160_000), '3687928')
  })
})

describe('10.1 és 10.3, szeminárium', () => {
  it('10.3 Példa (szem. osztalék 1)', () => {
    // most fizette ki: D0 = 4 USD, dp = 80%, ROE = 15%, r = 12%
    const g = fenntarthatoNovekedes(0.15, 0.8)
    dia(g, '3%')
    dia(4 * (1 + g), '4,12')
    dia(osztalekModellAr(4 * (1 + g), 0.12, g), '45,78')
  })

  it('10.1 Példa (szem. osztalék 2)', () => {
    // EPS0 = 100, ROE = 10%; t = 0…3 nincs osztalék, t = 4-től dp = 80%; r = 8%
    dia(ketszakaszosAr(100, 0.1, 4, 0.8, 0.08), '1549,67')
  })
})

describe('10.5 Osztalék és tőkeemelés tökéletes piacon, szeminárium', () => {
  it('10.5 Példa (szem. osztalék 3)', () => {
    const ex = exDividendAr(300, 60)
    dia(ex, '240')
    dia(felaprozottAr(ex, 2), '120')
    dia(alaptoke(200_000, 100), '20000000')
    dia(alaptoke(400_000, 100), '40000000')
    dia(300 * 200_000, '60000000')
    dia(120 * 400_000, '48000000')
    // c) felaprózás 1:2,5 → 500 000 db, névérték 40 USD, az alaptőke nem változik
    dia(300 / 120, '2,5')
    dia(100 / 2.5, '40')
    dia(alaptoke(500_000, 40), '20000000')
  })

  it('10.5 Példa (szem. osztalék 4)', () => {
    const db = 500_000_000 / 10_000
    dia(db, '50000')
    dia(750_000_000 / db, '15000')
    const ex = exDividendAr(15_000, 3000)
    dia(ex, '12000')
    dia(ex * db, '600000000')
    dia(felaprozottAr(ex, 4), '3000')
    dia(alaptoke(db * 4, 10_000 / 4), '500000000')
  })

  it('10.5 Példa (szem. osztalék 5)', () => {
    const ex = exDividendAr(1300, 300)
    dia(ex, '1000')
    const n = kibocsatandoDarab(100_000 * 300 + 20_000_000, ex)
    dia(n, '50000')
    dia(100_000 * 1300, '130000000')
    dia(100_000 * 1300 + n * ex, '180000000')
    dia((100_000 + n) * ex, '150000000')
    // c) az új részvények is kapnak osztalékot: n · 1300 = 300 · (100 000 + n) + 20 M
    dia((100_000 * 300 + 20_000_000) / (1300 - 300), '50000')
  })

  it('10.5 Példa (szem. osztalék 6)', () => {
    const ex = exDividendAr(3200, 200)
    dia(ex, '3000')
    const n = kibocsatandoDarab(50_000_000 + 10_000_000 + 30_000 * 200, ex)
    dia(n, '22000')
    dia(30_000 * 3200, '96000000')
    dia(30_000 * 3200 + n * ex, '162000000')
    dia((30_000 + n) * ex, '156000000')
    // eszközök piaci értéke: saját tőke + hitel
    dia(96_000_000 + 50_000_000, '146000000')
    dia(162_000_000 + 50_000_000, '212000000')
  })
})
