import { describe, expect, it } from 'vitest'
import { dia } from '../../calc/__tests__/dia.ts'
import { L13_ALAP, kockazatosRD, l13 } from '../szamitas/l13.ts'
import { L14_ALAP, L14_DMAX, l14, nehezsegPv } from '../szamitas/l14.ts'

// A ZH2 (tőkeszerkezet) leckéi: az alapértékekkel kijelzett számok a képlettár szemináriumi példái.

function ok13(s: Parameters<typeof l13>[0]) {
  const e = l13(s)
  if (e.hiba !== undefined) throw new Error(e.hiba)
  return e
}

function ok14(s: Parameters<typeof l14>[0]) {
  const e = l14(s)
  if (e.hiba !== undefined) throw new Error(e.hiba)
  return e
}

describe('13. lecke: MM-tételek, tőkeköltség és tőkeáttétel', () => {
  it('szem. 2: r_A = 12%, r_D = 8%: D/E = 0,25 → r_E = 13%, D/E = 1 → 16%; a WACC végig 12%', () => {
    const a = ok13(L13_ALAP)
    dia(a.rE, '13%')
    dia(a.WACC, '12%')
    dia(a.wD, '0,2')
    const b = ok13({ ...L13_ALAP, DperE: 1 })
    dia(b.rE, '16%')
    dia(b.WACC, '12%')
    dia(b.wD, '0,5')
    // 8.1 ellenőrzés: E/V · r_E + D/V · r_D = r_A
    expect(b.ellenorzes81).toBeCloseTo(0.12, 12)
    // a görbe minden pontján a WACC r_A, r_E lineárisan nő, r_D vízszintes
    for (const p of b.gorbe) {
      expect(p.WACC).toBeCloseTo(0.12, 12)
      expect(p.rD).toBe(0.08)
    }
    expect(b.gorbe[0].rE).toBeCloseTo(0.12, 12)
  })

  it('szem. adó 4 (bővített): D/V 0,2 → r_E 12,65%, WACC* 11,16%; D/V 0,5 → 14,6%, 9,9%', () => {
    const a = ok13({ ...L13_ALAP, bovitett: true, Tc: 0.35 })
    dia(a.rE, '12,65%')
    dia(a.WACC, '11,16%')
    const b = ok13({ ...L13_ALAP, bovitett: true, Tc: 0.35, DperE: 1 })
    dia(b.rE, '14,6%')
    dia(b.WACC, '9,9%')
    // a WACC* a tőkeáttétellel folyamatosan csökken
    for (let i = 1; i < b.gorbe.length; i++) expect(b.gorbe[i].WACC).toBeLessThan(b.gorbe[i - 1].WACC)
  })

  it('diás nézetben az adókulcs nem számít (a bővített T_C nem szivárog át)', () => {
    const e = ok13({ ...L13_ALAP, Tc: 0.35, bovitett: false })
    dia(e.rE, '13%')
    expect(e.Tc).toBe(0)
  })

  it('kockázatos hitel (szemléltető): a küszöbig minden a régi, fölötte r_D emelkedik, r_E lassabban nő, r_D < r_A marad', () => {
    const s = { ...L13_ALAP, bovitett: true, kockazatos: true, kuszob: 1, Tc: 0 }
    const alatta = ok13({ ...s, DperE: 1 })
    dia(alatta.rE, '16%')
    expect(alatta.rD).toBe(0.08)
    const fent = ok13({ ...s, DperE: 2 })
    expect(fent.rD).toBeGreaterThan(0.08)
    expect(fent.rD).toBeLessThan(0.12)
    // a kockázatmentes hitel esetén r_E(2) = 20% lenne
    expect(fent.rE).toBeLessThan(0.2)
    expect(fent.rE).toBeGreaterThan(alatta.rE)
    // az r_E meredeksége a küszöb fölött kisebb, mint alatta
    const g = fent.gorbe
    const lejtes = (i: number) => (g[i + 1].rE - g[i].rE) / (g[i + 1].DperE - g[i].DperE)
    expect(lejtes(g.length - 2)).toBeLessThan(lejtes(0))
    expect(kockazatosRD(0.12, 0.08, 0.5, 1)).toBe(0.08)
    expect(kockazatosRD(0.12, 0.08, 1e6, 1)).toBeCloseTo(0.12, 3)
  })

  it('T_C = 0 esetén a WACC* a kockázatos hitelnél is vízszintes, r_A-n', () => {
    const e = ok13({ ...L13_ALAP, bovitett: true, kockazatos: true, kuszob: 0.5, Tc: 0, DperE: 1.5 })
    for (const p of e.gorbe) expect(p.WACC).toBeCloseTo(0.12, 12)
    expect(e.probak[2]).toBe(true)
  })

  it('a „Próbáld ki” feltételek', () => {
    expect(ok13(L13_ALAP).probak).toEqual([false, false, false, false])
    expect(ok13({ ...L13_ALAP, DperE: 1 }).probak[0]).toBe(true)
    const p2 = ok13({ ...L13_ALAP, rD: 0.12, DperE: 1 })
    expect(p2.probak[1]).toBe(true)
    dia(p2.rE, '12%')
    expect(ok13({ ...L13_ALAP, bovitett: true, Tc: 0 }).probak[2]).toBe(true)
    expect(ok13({ ...L13_ALAP, bovitett: true, Tc: 0.35 }).probak[2]).toBe(false)
    // diás nézetben a bővített feladatok nem teljesülhetnek
    expect(ok13({ ...L13_ALAP, Tc: 0, kockazatos: true, DperE: 2 }).probak[2]).toBe(false)
    expect(ok13({ ...L13_ALAP, Tc: 0, kockazatos: true, DperE: 2 }).probak[3]).toBe(false)
    const p4 = ok13({ ...L13_ALAP, bovitett: true, kockazatos: true, kuszob: 1, DperE: 1.8 })
    expect(p4.probak[3]).toBe(true)
    expect(ok13({ ...L13_ALAP, bovitett: true, kockazatos: false, kuszob: 1, DperE: 1.8 }).probak[3]).toBe(false)
  })

  it('érvénytelen bemenetnél üzenet, nem hiba', () => {
    expect(l13({ ...L13_ALAP, rD: 0.2 }).hiba).toMatch(/r_D/)
    expect(l13({ ...L13_ALAP, rA: 0 }).hiba).toMatch(/r_A/)
    expect(l13({ ...L13_ALAP, rD: -0.01 }).hiba).toMatch(/negatív/)
    expect(l13({ ...L13_ALAP, DperE: -1 }).hiba).toMatch(/D\/E/)
    expect(l13({ ...L13_ALAP, bovitett: true, Tc: 1 }).hiba).toMatch(/adókulcs/)
    expect(l13({ ...L13_ALAP, DperE: NaN }).hiba).toMatch(/D\/E/)
    expect(l13({ ...L13_ALAP, kuszob: 0 }).hiba).toMatch(/küszöb/)
  })
})

describe('14. lecke: adómegtakarítás és optimális tőkeszerkezet', () => {
  it('szem. adó 1: V_U = 288, T_C = 40%, D = 80 → PV(TS) = 32, V_L = 320 (M USD)', () => {
    const e = ok14(L14_ALAP)
    expect(e.pvTS).toBeCloseTo(32, 12)
    expect(e.VL).toBeCloseTo(320, 12)
    // a tényleges érték V_L és a nehézségek költségének különbsége (8.10)
    expect(e.V).toBeCloseTo(320 - nehezsegPv(e.nehezseg, 80), 12)
    expect(e.V).toBeLessThan(e.VL)
  })

  it('D* belső maximum: a görbe előtte nő, utána csökken', () => {
    const e = ok14(L14_ALAP)
    expect(e.belso).toBe(true)
    expect(e.dOpt).toBeGreaterThan(0)
    expect(e.dOpt).toBeLessThan(L14_DMAX)
    // zárt alak: V' = T_C − 3N·D²/D_MAX³ = 0
    expect(e.dOpt).toBeCloseTo(Math.sqrt((0.4 * L14_DMAX ** 3) / (3 * e.nehezseg)), 0)
    for (const [D, V] of e.gorbe) expect(V).toBeLessThanOrEqual(e.vOpt + 1e-9 + 0 * D)
    expect(ok14({ ...L14_ALAP, D: e.dOpt + 40 }).V).toBeLessThan(e.vOpt)
    expect(ok14({ ...L14_ALAP, D: e.dOpt - 40 }).V).toBeLessThan(e.vOpt)
  })

  it('nehézségek nélkül a tényleges érték egyenlő V_L-lel, és nincs belső optimum', () => {
    const e = ok14({ ...L14_ALAP, bovitett: true, nehezseg: 0 })
    expect(e.pvNehez).toBe(0)
    expect(e.V).toBeCloseTo(e.VL, 12)
    for (const [D, V] of e.gorbe) expect(V).toBeCloseTo(288 + 0.4 * D, 9)
    expect(e.belso).toBe(false)
    expect(e.dOpt).toBe(L14_DMAX)
  })

  it('T_C = 0: az érték V_U mínusz a nehézségek költsége', () => {
    const e = ok14({ ...L14_ALAP, bovitett: true, Tc: 0, D: 100 })
    expect(e.pvTS).toBe(0)
    expect(e.VL).toBe(288)
    expect(e.V).toBeCloseTo(288 - nehezsegPv(90, 100), 12)
    expect(e.V).toBeLessThan(288)
    expect(e.belso).toBe(false)
    expect(e.dOpt).toBe(0)
  })

  it('a nehézségek költsége kis D-nél alig számít, később gyorsabban nő', () => {
    expect(nehezsegPv(90, 0)).toBe(0)
    expect(nehezsegPv(90, 20)).toBeLessThan(0.2)
    expect(nehezsegPv(90, 200)).toBeCloseTo(90, 12)
    // konvex: a második fél növekménye nagyobb, mint az első
    expect(nehezsegPv(90, 200) - nehezsegPv(90, 100)).toBeGreaterThan(nehezsegPv(90, 100) - nehezsegPv(90, 0))
  })

  it('diás nézetben a bővített csúszka nem számít', () => {
    const e = ok14({ ...L14_ALAP, nehezseg: 0, bovitett: false })
    expect(e.nehezseg).toBe(90)
    expect(e.V).toBeLessThan(e.VL)
  })

  it('a „Próbáld ki” feltételek', () => {
    expect(ok14(L14_ALAP).probak).toEqual([false, false, false, false])
    expect(ok14({ ...L14_ALAP, D: 160 }).probak[0]).toBe(true)
    expect(ok14({ ...L14_ALAP, D: 160, Tc: 0 }).probak[0]).toBe(false)
    expect(ok14({ ...L14_ALAP, D: 150 }).probak[1]).toBe(true)
    expect(ok14({ ...L14_ALAP, D: 50 }).probak[1]).toBe(false)
    expect(ok14({ ...L14_ALAP, bovitett: true, nehezseg: 0 }).probak[2]).toBe(true)
    expect(ok14({ ...L14_ALAP, bovitett: false, nehezseg: 0 }).probak[2]).toBe(false)
    expect(ok14({ ...L14_ALAP, bovitett: true, Tc: 0, D: 100 }).probak[3]).toBe(true)
    expect(ok14({ ...L14_ALAP, bovitett: true, Tc: 0, D: 0 }).probak[3]).toBe(false)
  })

  it('érvénytelen bemenetnél üzenet, nem hiba', () => {
    expect(l14({ ...L14_ALAP, VU: 0 }).hiba).toMatch(/V_U/)
    expect(l14({ ...L14_ALAP, Tc: 1 }).hiba).toMatch(/adókulcs/)
    expect(l14({ ...L14_ALAP, D: -5 }).hiba).toMatch(/adósság/)
    expect(l14({ ...L14_ALAP, D: 500 }).hiba).toMatch(/200/)
    expect(l14({ ...L14_ALAP, bovitett: true, nehezseg: -1 }).hiba).toMatch(/nehézségek/)
    expect(l14({ ...L14_ALAP, D: NaN }).hiba).toMatch(/adósság/)
  })
})
