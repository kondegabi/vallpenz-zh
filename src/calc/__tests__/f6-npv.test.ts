import { describe, expect, it } from 'vitest'
import { hozamDontes, irr, irrHaVan, npv, npvDontes, npvProfil } from '../npv.ts'
import { dia } from './dia.ts'

const projekt = [-165000, 63120, 70800, 91080]

describe('6. NPV és IRR', () => {
  it('6.1 Példa (4. ea)', () => {
    const NPV = npv(0.12, projekt)
    dia(NPV, '12 627,41')
    expect(npvDontes(NPV)).toBe('elfogadjuk')
  })

  it('6.2 Példa (4. ea)', () => {
    const IRR = irr(projekt)
    dia(IRR, '16,13%')
    expect(npv(IRR, projekt)).toBeCloseTo(0, 6)
    expect(hozamDontes(IRR, 0.12)).toBe('elfogadjuk')
  })

  it('6.1 NPV-profil: csökkenő, és az IRR-nél vált előjelet', () => {
    const pr = npvProfil(projekt, 0, 0.4, 400)
    expect(pr[0].npv).toBeCloseTo(63120 + 70800 + 91080 - 165000, 6)
    for (let i = 1; i < pr.length; i++) expect(pr[i].npv).toBeLessThan(pr[i - 1].npv)
    const valt = pr.findIndex((p) => p.npv < 0)
    dia(pr[valt].r, '16,13%', 0.001)
    const r12 = pr.find((p) => Math.abs(p.r - 0.12) < 1e-9)!
    dia(r12.npv, '12 627,41')
  })

  it('6.2 IRR csak előjelváltásnál van', () => {
    expect(irrHaVan([100, 50, 20])).toBeNull()
    expect(irrHaVan(projekt)).toBeCloseTo(irr(projekt), 12)
  })
})
