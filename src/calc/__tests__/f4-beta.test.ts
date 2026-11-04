import { describe, expect, it } from 'vitest'
import { betaCov, betaKorr, hianyzoBeta, kockazatFelbontas, korrelacioBetabol, portfolioBeta, sulyCelBetahoz } from '../beta.ts'
import { dia } from './dia.ts'

describe('4. Béta', () => {
  it('4.2 a két alak egyezik (cov / σ²M = k σi / σM)', () => {
    // nincs diás példa; csak a két alak azonosságát ellenőrzi
    const sI = 0.3
    const sM = 0.2
    const k = 0.5
    expect(betaCov(k * sI * sM, sM * sM)).toBeCloseTo(betaKorr(k, sI, sM), 12)
  })

  it('4.2 a korreláció visszafejtése a bétából', () => {
    expect(korrelacioBetabol(betaKorr(0.5, 0.3, 0.2), 0.3, 0.2)).toBeCloseTo(0.5, 12)
  })

  it('4.3 teljes = piaci + egyedi', () => {
    const f = kockazatFelbontas(1.2, 0.04, 0.01)
    expect(f.teljes).toBeCloseTo(1.44 * 0.04 + 0.01, 12)
  })

  it('4.4 Példa (3. ea)', () => {
    dia(portfolioBeta([0.4, 0.6], [0.8, 1.4]), '1,16')
  })

  it('4.4 Példa (5. ea)', () => {
    dia(portfolioBeta([0.15, 0.2, 0.3, 0.35], [0.8, 1.2, 1.05, 1.35]), '1,1475')
  })

  it('4.4 Visszafejtés (5. ea)', () => {
    // 1 = ⅓ × 1,2 + ⅓ × βB + ⅓ × 0
    dia(hianyzoBeta(1, [1 / 3, 1 / 3, 1 / 3], [1.2, null, 0]), '1,8')
  })

  it('4.4 Súly visszafejtése (5. ea)', () => {
    const a = sulyCelBetahoz(0.9, 1.2)
    dia(a.w, '75%')
    dia(a.wf, '25%')
    const b = sulyCelBetahoz(2.4, 1.2)
    dia(b.w, '200%')
    dia(b.wf, '−100%')
  })
})
