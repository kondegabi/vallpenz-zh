import { describe, expect, it } from 'vitest'
import {
  historikusLevezetes,
  kockazatiPremium,
  szigmaSav,
  szoras,
  variancia,
  varianciaLevezetes,
  varhatoHozam,
} from '../kockazat.ts'
import { dia } from './dia.ts'

describe('2. Várható hozam és szórás', () => {
  it('2.1 Példa (2. ea)', () => {
    // 50% / 50% valószínűség, A: 10% / 30%, B: 70% / −20%, r_f = 8%
    const p = [0.5, 0.5]
    const EA = varhatoHozam(p, [0.1, 0.3])
    const EB = varhatoHozam(p, [0.7, -0.2])
    dia(EA, '20%')
    dia(EB, '25%')
    dia(kockazatiPremium(EA, 0.08), '12%')
    dia(kockazatiPremium(EB, 0.08), '17%')
  })

  it('2.2 Példa (2. ea)', () => {
    // 20% / 80% valószínűség, A: 10% / 30%
    const p = [0.2, 0.8]
    const r = [0.1, 0.3]
    dia(varhatoHozam(p, r), '26%')
    dia(variancia(p, r), '0,0064')
    dia(szoras(p, r), '8%')
  })

  it('2.2 kidolgozó táblázat (2. ea, 10. dia)', () => {
    const l = varianciaLevezetes([0.2, 0.8], [0.1, 0.3])
    dia(l.sorok[0].elteres, '−16%')
    dia(l.sorok[1].elteres, '4%')
    dia(l.sorok[0].negyzet, '0,0256')
    dia(l.sorok[1].negyzet, '0,0016')
    dia(l.sorok[0].sulyozott, '0,00512')
    dia(l.sorok[1].sulyozott, '0,00128')
    dia(l.variancia, '0,0064')
    // a dia hibája: √0,064 helyett √0,0064 = 0,08
    dia(l.szoras, '0,08')
  })

  it('2.3 Példa (1. ea)', () => {
    // 10%, 12%, 3%, −9%
    const h = historikusLevezetes([0.1, 0.12, 0.03, -0.09])
    dia(h.atlag, '4%')
    dia(h.negyzetosszeg, '0,027')
    dia(h.variancia, '0,009')
    dia(h.szoras, '9,49%')
  })

  it('2.4 Példa (jegyzet, Ross 12.11)', () => {
    // 12,0% átlag, 19,8% szórás
    const [a1, f1] = szigmaSav(0.12, 0.198, 1)
    const [a2, f2] = szigmaSav(0.12, 0.198, 2)
    dia(a1, '−7,8%')
    dia(f1, '31,8%')
    dia(a2, '−27,6%')
    dia(f2, '51,6%')
    expect(a1).toBeLessThan(f1)
  })
})
