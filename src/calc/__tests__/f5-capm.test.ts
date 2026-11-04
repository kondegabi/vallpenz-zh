import { describe, expect, it } from 'vitest'
import {
  arazas,
  betaVissza,
  capm,
  kevertPortfolio,
  kevertSzoras,
  meredekseg,
  mrp,
  mrpBetaKulonbsegbol,
  mrpVissza,
  rfKetEszkozbol,
  rfVisszaErMbol,
  rfVisszaMRPbol,
  sulyCelHozamhoz,
} from '../capm.ts'
import { portfolioVarianciaKorr } from '../portfolio.ts'
import { dia } from './dia.ts'

describe('5. CAPM és SML', () => {
  it('5.1 Példa (5. ea)', () => {
    // r_f = 3%, E(rM) = 12%, β = 0,7
    dia(mrp(0.12, 0.03), '9%')
    dia(capm(0.03, 0.7, mrp(0.12, 0.03)), '9,3%')
  })

  it('5.1 Visszafejtés β-ra (5. ea)', () => {
    // E(r) = 18,3%, r_f = 3%, E(rM) = 12%
    dia(betaVissza(0.183, 0.03, mrp(0.12, 0.03)), '1,7')
  })

  it('5.1 Visszafejtés r_f-re (5. ea)', () => {
    // E(r) = 10,5%, β = 0,85, E(rM) = 12%
    dia(rfVisszaErMbol(0.105, 0.85, 0.12), '2%')
  })

  it('5.1 Csapda: ugyanezek a számok MRP-ként (5. ea)', () => {
    // ha a 12% a prémium (MRP), nem a piac hozama: r_f = 0,3%
    dia(rfVisszaMRPbol(0.105, 0.85, 0.12), '0,3%')
  })

  it('5.1 Visszafejtés MRP-re (5. ea)', () => {
    // E(rC) = 14%, β = 1,5, r_f = 2%
    dia(mrpVissza(0.14, 0.02, 1.5), '8%')
  })

  it('5.1 r_f-visszafejtés β = 1 mellett nem értelmezett', () => {
    expect(() => rfVisszaErMbol(0.1, 1, 0.12)).toThrow()
  })

  it('5.2 Példa (5. ea)', () => {
    // r_f = 2%, E(rM) = 8,5%; G: 12%, β 1,6; H: 9%, β 0,8
    const MRP = mrp(0.085, 0.02)
    dia(MRP, '6,5%')
    dia(capm(0.02, 1.6, MRP), '12,4%')
    dia(meredekseg(0.12, 0.02, 1.6), '6,25%')
    expect(arazas(0.12, 0.02, 1.6, MRP)).toBe('túlárazott')
    dia(capm(0.02, 0.8, MRP), '7,2%')
    dia(meredekseg(0.09, 0.02, 0.8), '8,75%')
    expect(arazas(0.09, 0.02, 0.8, MRP)).toBe('alulárazott')
    expect(arazas(capm(0.02, 1.1, MRP), 0.02, 1.1, MRP)).toBe('helyesen árazott')
  })

  it('5.3 Példa (5. ea)', () => {
    // E: 18%, β 1,5; F: 8%, β 0,5
    const rf = rfKetEszkozbol(0.18, 1.5, 0.08, 0.5)
    dia(rf, '3%')
    // 0,08 = 0,03 + 0,5 × (E(rM) − 0,03)
    const ErM = rf + mrpVissza(0.08, rf, 0.5)
    dia(ErM, '13%')
    // mindkét eszköz meredeksége egyenlő
    expect(meredekseg(0.18, rf, 1.5)).toBeCloseTo(meredekseg(0.08, rf, 0.5), 12)
  })

  it('5.3 Rokon típus (5. ea)', () => {
    // βJ = βK + 0,3, E(rJ) = 12,75%, E(rK) = 10,65%
    dia(mrpBetaKulonbsegbol(0.1275 - 0.1065, 0.3), '7%')
  })

  it('5.4 Példa (3. ea)', () => {
    // E(rA) = 20%, β = 1,6, r_f = 8%
    const a = kevertPortfolio(0.25, 0.2, 1.6, 0.08)
    dia(a.Er, '11%')
    dia(a.beta, '0,4')
    const b = kevertPortfolio(1.5, 0.2, 1.6, 0.08)
    dia(b.Er, '26%')
    dia(b.beta, '2,4')
  })

  it('5.4 Példa (5. ea)', () => {
    // D: 12%, β 1,2, r_f 4%, cél E(rP) = 9%
    const w = sulyCelHozamhoz(0.09, 0.12, 0.04)
    dia(w, '0,625')
    dia(kevertPortfolio(w, 0.12, 1.2, 0.04).beta, '0,75')
  })

  it('5.4 keverék szórása: w·σ(r_A), ugyanaz, mint a 3.4 képlete σ_f = 0-val', () => {
    for (const w of [0, 0.25, 1, 1.5]) {
      expect(kevertSzoras(w, 0.25)).toBeCloseTo(Math.sqrt(portfolioVarianciaKorr(w, 1 - w, 0.25, 0, 0)), 12)
    }
  })
})
