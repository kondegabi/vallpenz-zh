import { describe, expect, it } from 'vitest'
import {
  diszkretTokesites,
  folytonosErtek,
  folytonosHozam,
  indexPalya,
  folytonosHozamok,
  hozamokArfolyamokbol,
  mertaniAtlag,
  szamtaniAtlag,
  teljesHozam,
} from '../hozam.ts'
import { dia } from './dia.ts'

describe('1. Hozamszámítás és átlagok', () => {
  it('1.1 Példa (1. ea)', () => {
    // kezdő árfolyam 50 USD, osztalék 2 USD, záró árfolyam 53 USD
    const r = teljesHozam(50, 53, 2)
    dia(r.osztalekHozam, '4%')
    dia(r.arfolyamHozam, '6%')
    dia(r.teljes, '10%')
  })

  it('1.3 Példa (1. ea)', () => {
    // 100 → 200 → 100 USD
    const r = hozamokArfolyamokbol([100, 200, 100])
    dia(r[0], '100%')
    dia(r[1], '−50%')
    dia(szamtaniAtlag(r), '25%')
    dia(mertaniAtlag(r), '0%', 1e-12)
  })

  it('1.4 Példa (2. ea) #1', () => {
    // 100 → 110 → 105
    const rc = folytonosHozamok([100, 110, 105])
    dia(rc[0], '9,53%')
    dia(rc[1], '−4,65%')
    dia(szamtaniAtlag(rc), '2,44%')
    // a folytonos hozamok átlaga csak a kezdő és záró árfolyamtól függ
    expect(szamtaniAtlag(rc)).toBeCloseTo(folytonosHozam(100, 105, 2), 12)
    const r = hozamokArfolyamokbol([100, 110, 105])
    dia(szamtaniAtlag(r), '2,73%')
    dia(mertaniAtlag(r), '2,47%')
  })

  it('1.4 Példa (2. ea) #2', () => {
    // 100 → 50 → 75 → 37,5 → 56,25
    const arak = [100, 50, 75, 37.5, 56.25]
    const r = hozamokArfolyamokbol(arak)
    dia(szamtaniAtlag(r), '0', 1e-12)
    dia(mertaniAtlag(r), '−13,4%')
    dia(folytonosHozam(100, 56.25, 4), '−14,4%')
  })

  it('1.4 P_T = P_0 e^(r_c T) visszaadja a folytonos hozamot', () => {
    const PT = folytonosErtek(100, 0.1, 2)
    expect(folytonosHozam(100, PT, 2)).toBeCloseTo(0.1, 12)
    // a 2. ea példája: 100-ról 4 év alatt −14,4%-kal 56,25
    expect(folytonosErtek(100, folytonosHozam(100, 56.25, 4), 4)).toBeCloseTo(56.25, 9)
  })

  it('indexpálya: 1 dollár növekedése (1. ea 14. dia)', () => {
    expect(indexPalya([100, 200, 100])).toEqual([1, 2, 1])
    expect(indexPalya([50, 53])[1]).toBeCloseTo(1.06, 12)
  })

  it('folytonos kamatos kamatozás sora (1. ea 30. dia)', () => {
    // A dián a jegyek levágva szerepelnek (2,6925 és 2,7145 kerekítve 2,6926 és 2,7146),
    // ezért itt a levágott alakkal vetjük össze.
    const levag = (x: number, jegy: number) => Math.floor(x * 10 ** jegy + 1e-9) / 10 ** jegy
    const sor: [number, number, number][] = [
      [1, 2, 0],
      [2, 2.25, 2],
      [4, 2.4414, 4],
      [12, 2.613, 3],
      [52, 2.6925, 4],
      [365, 2.7145, 4],
      [8760, 2.7181, 4],
      [525600, 2.718279, 6],
      [31536000, 2.718281, 6],
    ]
    for (const [m, ertek, jegy] of sor) expect(levag(diszkretTokesites(1, m), jegy), `m = ${m}`).toBeCloseTo(ertek, jegy + 2)
    // m → ∞: e^(rT)
    expect(diszkretTokesites(0.1, 1e9, 2)).toBeCloseTo(folytonosErtek(1, 0.1, 2), 8)
  })
})
