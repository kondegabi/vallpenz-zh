import { describe, expect, it } from 'vitest'
import { capm, mrp } from '../capm.ts'
import {
  adomegtakaritasEves,
  adomegtakaritasPvOrok,
  adomegtakaritasPvVeges,
  adosRE,
  egyenloTorlesztesKamatai,
  eszkozBeta,
  hitelBeta,
  mmIIRE,
  modositottWacc,
  relativAdoelony,
  tokeSzerkezetHozam,
  valasztosErtek,
  vallalatertekAdoval,
} from '../tokeszerkezet.ts'
import { dia } from './dia.ts'

// A 8. fejezet képletei a szemináriumi példák megoldásaival (forras/zh2/) és a diasor képleteivel.

describe('8.1 Tőkeköltség tökéletes piacon (MM I. tétel)', () => {
  it('8.1 Példa (szem. 1)', () => {
    dia(tokeSzerkezetHozam([[0.6, 0.07], [0.4, 0.2]]), '12,2%')
  })

  it('8.1 Példa (szem. 4)', () => {
    dia(tokeSzerkezetHozam([[0.2, 0.05], [0.15, 0.06], [0.25, 0.15], [0.4, 0.2]]), '13,65%')
  })

  it('8.1 Példa (szem. 5)', () => {
    dia(tokeSzerkezetHozam([[400 / 2000, 0.07], [1600 / 2000, 0.17]]), '15%')
    // további 200 hitellel a tőkeköltség nem változik: az új r_E-vel ugyanaz jön ki
    const rE = mmIIRE(0.15, 0.07, 600 / 1400)
    dia(tokeSzerkezetHozam([[600 / 2000, 0.07], [1400 / 2000, rE]]), '15%')
  })
})

describe('8.2 Eszközök bétája', () => {
  it('8.2 Példa (szem. 3)', () => {
    const rE = capm(0.05, 0.7, mrp(0.15, 0.05))
    dia(rE, '12%')
    dia(tokeSzerkezetHozam([[0.4, 0.05], [0.6, rE]]), '9,2%')
    dia(eszkozBeta(0.6, 0.7, 0.4, 0), '0,42')
  })

  it('8.2 Példa (szem. 6)', () => {
    dia(capm(0.05, 1.5, 0.08), '17%')
    dia(hitelBeta(0.07, 0.05, 0.08), '0,25')
    dia(eszkozBeta(0.8, 1.5, 0.2, 0.25), '1,25')
    dia(capm(0.05, 1.25, 0.08), '15%')
  })
})

describe('8.3 MM II. tétel', () => {
  it('8.3 Példa (szem. 2)', () => {
    dia(mmIIRE(0.12, 0.08, 0.2 / 0.8), '13%')
    dia(mmIIRE(0.12, 0.08, 1), '16%')
  })

  it('8.3 Példa (szem. 7)', () => {
    dia(mmIIRE(0.2, 0.05, 0.25 / 0.75), '25%')
  })

  it('8.3 Példa (szem. 8)', () => {
    dia(mmIIRE(0.15, 0.06, 1), '24%')
    dia(mmIIRE(0.15, 0.08, 1), '22%')
  })

  it('8.3 Példa (szem. 9)', () => {
    const rA = tokeSzerkezetHozam([[0.4, 0.08], [0.6, 0.2]])
    dia(rA, '15,2%')
    dia(mmIIRE(rA, 0.08, 0), '15,2%')
  })
})

describe('8.4–8.6 Adómegtakarítás és vállalatérték', () => {
  it('8.4 Példa (szem. adó 1)', () => {
    dia(adomegtakaritasPvOrok(0.4, 80), '32')
    dia(adomegtakaritasPvOrok(0.4, 40), '16')
    expect(adomegtakaritasEves(0.4, 80, 0.08)).toBeCloseTo(2.56, 10)
  })

  it('8.5 Példa (szem. adó 1)', () => {
    // a megoldás kerekített faktorral (AF = 3,993) kap 10,222-t, pontosan 10,2213
    dia(adomegtakaritasPvVeges(0.4, [6.4, 6.4, 6.4, 6.4, 6.4], 0.08), '10,222', 0.001)
  })

  it('8.5 Példa (szem. adó 3)', () => {
    const kamatok = egyenloTorlesztesKamatai(30, 3, 0.05)
    expect(kamatok.map((k) => Number(k.toFixed(10)))).toEqual([1.5, 1, 0.5])
    dia(adomegtakaritasPvVeges(0.2, kamatok, 0.05), '0,55')
  })

  it('8.6 Példa (szem. adó 1)', () => {
    const VU = 320 - adomegtakaritasPvOrok(0.4, 80)
    dia(VU, '288')
    dia(vallalatertekAdoval(VU, 0, 0) + adomegtakaritasPvVeges(0.4, [6.4, 6.4, 6.4, 6.4, 6.4], 0.08), '298,222', 0.001)
    dia(vallalatertekAdoval(VU, 0.4, 80), '320')
  })
})

describe('8.7–8.8 Tőkeköltség adóval', () => {
  it('8.7 Példa (szem. adó 4)', () => {
    dia(adosRE(0.12, 0.08, 0.2 / 0.8, 0.35), '12,65%')
    dia(adosRE(0.12, 0.08, 1, 0.35), '14,6%')
  })

  it('8.8 Példa (szem. adó 2)', () => {
    dia(modositottWacc(240 / 320, 0.25, 80 / 320, 0.05, 0.3), '19,625%')
  })

  it('8.8 Példa (szem. adó 4)', () => {
    dia(modositottWacc(0.8, adosRE(0.12, 0.08, 0.25, 0.35), 0.2, 0.08, 0.35), '11,16%')
    dia(modositottWacc(0.5, adosRE(0.12, 0.08, 1, 0.35), 0.5, 0.08, 0.35), '9,9%')
  })

  it('a WACC* folyamatosan csökken, ahogy a tőkeáttétel nő (szem. adó 4)', () => {
    const w = (dv: number) => modositottWacc(1 - dv, adosRE(0.12, 0.08, dv / (1 - dv), 0.35), dv, 0.08, 0.35)
    expect(w(0)).toBeCloseTo(0.12, 10)
    expect(w(0.2)).toBeLessThan(w(0))
    expect(w(0.5)).toBeLessThan(w(0.2))
  })
})

describe('8.9–8.10 Relatív adóelőny és választásos elmélet', () => {
  it('a relatív adóelőny csak társasági adóval éppen T_C (25. dia)', () => {
    expect(relativAdoelony(0.2)).toBeCloseTo(0.2, 10)
  })

  it('a vállalat értéke a két jelenérték különbségével tér el V_U-tól (27. dia)', () => {
    expect(valasztosErtek(288, 32, 10)).toBe(310)
  })
})
