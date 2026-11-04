import { describe, expect, it } from 'vitest'
import { capm } from '../capm.ts'
import { hozamDontes } from '../npv.ts'
import {
  atlagRE,
  capmRE,
  d1,
  gordonAr,
  gordonRE,
  kotvenyAr,
  piaciErtekek,
  rdAdozasUtan,
  sulyok,
  sulyokDEbol,
  wacc,
  ytm,
} from '../toke.ts'
import { dia } from './dia.ts'

describe('7. Tőkeköltség és WACC', () => {
  it('7.1 Példa (4. ea)', () => {
    // D_0 = 4 USD, P_0 = 60 USD, g = 6%. A képlettár korábbi 13,27%-a hibás volt, helyesen 13,07%.
    const D1 = d1(4, 0.06)
    dia(D1, '4,24')
    dia(gordonRE(D1, 60, 0.06), '13,07%')
  })

  it('7.1 Példa (videó)', () => {
    // D_0 = 5 USD, P_0 = 70 USD, g = 4%
    const D1 = d1(5, 0.04)
    dia(D1, '5,2')
    dia(gordonRE(D1, 70, 0.04), '11,43%')
  })

  it('7.1 a két alak egymás megfordítása', () => {
    expect(gordonAr(4.24, gordonRE(4.24, 60, 0.06), 0.06)).toBeCloseTo(60, 9)
    expect(() => gordonAr(4.24, 0.05, 0.06)).toThrow()
  })

  it('7.2 Ha mindkét módszer adatai adottak (4. ea)', () => {
    const rECapm = capmRE(0.06, 1.2, 0.07)
    const rEGordon = gordonRE(d1(2, 0.08), 30, 0.08)
    dia(rECapm, '14,4%')
    dia(rEGordon, '15,2%')
    dia(atlagRE(rECapm, rEGordon), '14,8%')
  })

  it('7.2 4. ea, 29. dia (r_f = 3% változat, a döntésig)', () => {
    // a dián 0,04-gyel számolva 11,8%; ha r_f tényleg 3%, akkor 10,8%
    dia(capmRE(0.03, 1.3, 0.06), '10,8%')
  })

  it('7.3 Példa (5. ea)', () => {
    dia(rdAdozasUtan(0.09, 0.21), '7,11%')
  })

  it('7.3 YTM kiszámítása (kiegészítés), a Csapda 4. ea példája', () => {
    // 7%-os kupon, 960 USD ár, 22 év hátra, N = 1000 USD, éves kupon
    const y = ytm(960, 70, 22)
    dia(y, '7,37%')
    expect(kotvenyAr(70, 1000, 22, y)).toBeCloseTo(960, 6)
    // diszkonttal forog, ezért a hozam a kupon fölött van
    expect(y).toBeGreaterThan(0.07)
  })

  it('7.4 Példa (5. ea), teljes lánc', () => {
    // 1,4 M részvény × 20 USD, β = 0,74; adósság 5 M névérték 93%-on, YTM 11%; r_f = 8%, MRP = 7%, T_C = 21%
    const rE = capmRE(0.08, 0.74, 0.07)
    dia(rE, '13,18%')
    dia(rdAdozasUtan(0.11, 0.21), '8,69%')
    const { E, D, V } = piaciErtekek(1.4e6, 20, 5e6, 0.93)
    dia(E / 1e6, '28')
    dia(D / 1e6, '4,65')
    dia(V / 1e6, '32,65')
    const s = sulyok(E, D)
    dia(s.wE, '0,8576')
    dia(s.wD, '0,1424')
    dia(wacc(s.wE, rE, s.wD, 0.11, 0.21), '12,54%')
  })

  it('7.4 Példa (videó)', () => {
    // 2 M × 10 USD, β = 1,2; 6 M névérték 90%-on, YTM 8%; r_f = 4%, MRP = 7%, T_C = 20%
    const rE = capmRE(0.04, 1.2, 0.07)
    dia(rE, '12,4%')
    const { E, D } = piaciErtekek(2e6, 10, 6e6, 0.9)
    const s = sulyok(E, D)
    dia(s.wE, '0,7874')
    dia(wacc(s.wE, rE, s.wD, 0.08, 0.2), '11,1%')
  })

  it('7.4 Súlyok D/E arányból ugyanazt adják', () => {
    const s = sulyok(28e6, 4.65e6)
    const de = sulyokDEbol(4.65 / 28)
    expect(de.wE).toBeCloseTo(s.wE, 12)
    expect(de.wD).toBeCloseTo(s.wD, 12)
  })

  it('7.5 Példa (5. ea)', () => {
    // tisztán saját tőkés cég, β = 1, r_f = 7%, MRP = 8% → WACC = 15%
    const WACC = capm(0.07, 1, 0.08)
    dia(WACC, '15%')
    // A: 14%, β 0,6
    const elvartA = capm(0.07, 0.6, 0.08)
    dia(elvartA, '11,8%')
    expect(hozamDontes(0.14, WACC)).toBe('elutasítjuk')
    expect(hozamDontes(0.14, elvartA)).toBe('elfogadjuk')
    // B: 16%, β 1,2
    const elvartB = capm(0.07, 1.2, 0.08)
    dia(elvartB, '16,6%')
    expect(hozamDontes(0.16, WACC)).toBe('elfogadjuk')
    expect(hozamDontes(0.16, elvartB)).toBe('elutasítjuk')
  })
})
