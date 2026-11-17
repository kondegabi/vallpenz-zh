import { describe, expect, it } from 'vitest'
import { baumolC } from '../../calc/likviditas.ts'
import { dia } from '../../calc/__tests__/dia.ts'
import { BAUMOL_ALAP, CIKLUSOK, MO_ALAP, MO_EMPEC, baumol, millerOrr, millerOrrUt } from '../szamitas/l15.ts'
import { L16_ALAP, arDpbol, dpHatar, l16 } from '../szamitas/l16.ts'

// A ZH2 pénzügyi leckéi (15–16): a 15. lecke alapértékei a diák számai (13., 16., 17. dia),
// a 16. lecke alapértékei szemléltetők, ezért ott a képlet-összefüggéseket ellenőrizzük.

function okB(s: Parameters<typeof baumol>[0]) {
  const e = baumol(s)
  if (e.hiba !== undefined) throw new Error(e.hiba)
  return e
}

function okM(s: Parameters<typeof millerOrr>[0]) {
  const e = millerOrr(s)
  if (e.hiba !== undefined) throw new Error(e.hiba)
  return e
}

function ok16(s: Parameters<typeof l16>[0]) {
  const e = l16(s)
  if (e.hiba !== undefined) throw new Error(e.hiba)
  return e
}

describe('15. lecke: Baumol–Allais–Tobin (13. dia, Vulcan Corporation)', () => {
  it('d = 100, r = 5%, F = 10 → T = 36 500, C_opt = 3821, L_opt = 0,1047 év = 38,2 nap, átlag C/2', () => {
    const e = okB(BAUMOL_ALAP)
    dia(e.T, '36500')
    dia(e.Copt, '3821')
    // a dia 0,104-et ír (csonkolva); a kerekített érték 0,1047
    dia(e.Lev, '0,1047')
    dia(e.Lnap, '38,2')
    dia(e.atlag, '1910,5')
    // a 3821-es felvétel éppen az optimum körüli: a ciklus ideje ≈ L_opt
    expect(e.LnapC).toBeCloseTo(38.21, 2)
  })

  it('az optimumnál a két költség egyenlő, és a görbe rácsbeli minimuma C_opt (9.1)', () => {
    const e = okB(BAUMOL_ALAP)
    const T = e.T
    expect(e.Copt).toBeCloseTo(baumolC(T, BAUMOL_ALAP.F, BAUMOL_ALAP.r), 9)
    // az optimumban r·C/2 = F·T/C
    expect((BAUMOL_ALAP.r * e.Copt) / 2).toBeCloseTo((BAUMOL_ALAP.F * T) / e.Copt, 9)
    // a rács legolcsóbb pontja az optimum egy rácsléptéken belül van
    const min = e.koltseg.reduce((m, p) => (p.ossz < m.ossz ? p : m))
    const lepes = e.cMax / e.koltseg.length
    expect(Math.abs(min.C - e.Copt)).toBeLessThanOrEqual(lepes)
    // a görbe U alakú: a minimumtól balra csökken, jobbra nő
    const i = e.koltseg.indexOf(min)
    expect(e.koltseg[0].ossz).toBeGreaterThan(min.ossz)
    expect(e.koltseg[e.koltseg.length - 1].ossz).toBeGreaterThan(min.ossz)
    expect(e.koltseg[i - 5].ossz).toBeGreaterThan(e.koltseg[i - 1].ossz)
    expect(e.koltseg[i + 5].ossz).toBeGreaterThan(e.koltseg[i + 1].ossz)
    // minimális összköltség: √(2·T·F·r) = 2 · r · C_opt / 2
    expect(e.osszOpt).toBeCloseTo(Math.sqrt(2 * T * BAUMOL_ALAP.F * BAUMOL_ALAP.r), 9)
  })

  it('a fűrészfog C-ről 0-ra csökken, a felvételnél visszaugrik; a ciklus C/d nap', () => {
    const e = okB(BAUMOL_ALAP)
    expect(e.fureszfog[0]).toEqual([0, 3821])
    expect(e.fureszfog[1][1]).toBe(0)
    expect(e.fureszfog[1][0]).toBeCloseTo(38.21, 9)
    expect(e.fureszfog[2]).toEqual([e.fureszfog[1][0], 3821])
    expect(e.fureszfog[e.fureszfog.length - 1][0]).toBeCloseTo(CIKLUSOK * 38.21, 9)
    for (const [, v] of e.fureszfog) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(3821)
    }
  })

  it('négyszeres F → C_opt kétszeres; kétszeres r → C_opt ∛… √2-ed részére csökken', () => {
    const a = okB(BAUMOL_ALAP)
    expect(okB({ ...BAUMOL_ALAP, F: 40 }).Copt / a.Copt).toBeCloseTo(2, 9)
    expect(okB({ ...BAUMOL_ALAP, r: 0.1 }).Copt / a.Copt).toBeCloseTo(1 / Math.SQRT2, 9)
  })

  it('érvénytelen bemenet: hibaüzenet, nem kivétel', () => {
    for (const rossz of [{ d: 0 }, { r: 0 }, { F: 0 }, { C: 0 }, { d: -1 }, { r: Number.NaN }]) {
      const e = baumol({ ...BAUMOL_ALAP, ...rossz })
      expect(e.hiba).toEqual(expect.any(String))
    }
  })

  it('Próbáld ki feltételek (Baumol)', () => {
    expect(okB(BAUMOL_ALAP).probak).toEqual([false, false, false])
    expect(okB({ ...BAUMOL_ALAP, F: 40 }).probak[0]).toBe(true)
    expect(okB({ ...BAUMOL_ALAP, r: 0.1 }).probak[1]).toBe(true)
    expect(okB({ ...BAUMOL_ALAP, C: 8000 }).probak[2]).toBe(true)
  })
})

describe('15. lecke: Miller–Orr (16–17. dia)', () => {
  it('17. dia: L = 100, F = 10, σ = 200, r = 1% → C* = 411 (410,7), U* = 1032, átlag 514', () => {
    const e = okM(MO_ALAP)
    dia(e.C, '411', 0.5)
    dia(e.C, '410,7')
    // U* a kerekítetlen C*-ból: 3 · 410,7 − 200 = 1032,1
    dia(e.U, '1032', 0.5)
    dia(e.atlag, '514', 0.5)
    expect(e.U).toBeCloseTo(3 * e.C - 2 * MO_ALAP.L, 9)
    expect(e.atlag).toBeCloseTo((4 * e.C - MO_ALAP.L) / 3, 9)
  })

  it('16. dia (EMPEC, napi): σ = 357 697, F = 10, r = 0,0060962%, L = 350 000 → C* ≈ 600 616, U* = 1 101 848', () => {
    const e = okM(MO_EMPEC)
    // a napi kamat kamatos átváltással jön; a dia a C*-ot lefelé kerekíti, és az U*-ot abból számolja
    expect(Math.floor(e.C)).toBe(600616)
    expect(3 * Math.floor(e.C) - 2 * MO_EMPEC.L).toBe(1101848)
  })

  it('C* és U* összefüggései: L < C* < U*, U* − C* = 2 · (C* − L)', () => {
    for (const s of [MO_ALAP, MO_EMPEC, { ...MO_ALAP, L: 0 }, { ...MO_ALAP, sigma: 50, r: 0.05 }]) {
      const e = okM(s)
      expect(e.C).toBeGreaterThan(s.L)
      expect(e.U).toBeGreaterThan(e.C)
      expect(e.U - e.C).toBeCloseTo(2 * (e.C - s.L), 6)
      // az átlag C* és a középpont közé esik
      expect(e.atlag).toBeGreaterThan(s.L)
      expect(e.atlag).toBeLessThan(e.U)
    }
  })

  it('a szemléltető pálya sosem lépi át az [L, U*] sávot, C*-ról indul, és a korlátnál C*-ra ugrik', () => {
    for (const seed of [1, 7, 42, 2024, 99999]) {
      for (const s of [{ ...MO_ALAP, seed }, { ...MO_EMPEC, seed }]) {
        const e = okM(s)
        expect(e.ut[0]).toEqual([0, e.C])
        for (const [, v] of e.ut) {
          expect(v).toBeGreaterThanOrEqual(s.L)
          expect(v).toBeLessThanOrEqual(e.U)
        }
        // minden esemény: a korláton ugrik C*-ra (az előző pont a korlát, a következő C*)
        for (const ev of e.esemenyek) {
          const i = e.ut.findIndex(([t, v], k) => t === ev.t && k > 0 && v === e.C && e.ut[k - 1][0] === ev.t)
          expect(i).toBeGreaterThan(0)
          expect(e.ut[i - 1][1]).toBe(ev.fajta === 'vetel' ? e.U : s.L)
        }
      }
    }
  })

  it('a pálya a seedtől függ (ugyanaz a seed ugyanaz), és a σ csak skáláz', () => {
    const a = millerOrrUt(400, 100, 1000, 200, 5)
    const b = millerOrrUt(400, 100, 1000, 200, 5)
    expect(a).toEqual(b)
    expect(millerOrrUt(400, 100, 1000, 200, 6).ut).not.toEqual(a.ut)
    // elég hosszú pályán mindkét korlát előfordul
    const hosszu = millerOrrUt(411, 100, 1032, 200, 3, 2000)
    expect(hosszu.esemenyek.some((x) => x.fajta === 'vetel')).toBe(true)
    expect(hosszu.esemenyek.some((x) => x.fajta === 'eladas')).toBe(true)
  })

  it('σ kétszerese → C* − L ∛4-szeresére nő; r kétszerese → ∛2-ed részére csökken', () => {
    const a = okM(MO_ALAP)
    expect((okM({ ...MO_ALAP, sigma: 400 }).C - 100) / (a.C - 100)).toBeCloseTo(Math.cbrt(4), 9)
    expect((okM({ ...MO_ALAP, r: 0.02 }).C - 100) / (a.C - 100)).toBeCloseTo(1 / Math.cbrt(2), 9)
  })

  it('érvénytelen bemenet: hibaüzenet, nem kivétel', () => {
    for (const rossz of [{ L: -1 }, { F: 0 }, { sigma: 0 }, { r: 0 }, { r: Number.NaN }, { sigma: -5 }]) {
      expect(millerOrr({ ...MO_ALAP, ...rossz }).hiba).toEqual(expect.any(String))
    }
  })

  it('Próbáld ki feltételek (Miller–Orr)', () => {
    expect(okM(MO_ALAP).probak).toEqual([false, false, false])
    expect(okM({ ...MO_ALAP, sigma: 400 }).probak[0]).toBe(true)
    expect(okM(MO_EMPEC).probak[1]).toBe(true)
    expect(okM({ ...MO_ALAP, F: 20 }).probak[2]).toBe(true)
  })
})

describe('16. lecke: osztalék, visszaforgatás és árfolyam (10.1, 10.3)', () => {
  it('szemléltető alapértékek: g = 9%, DIV_1 = 2, P_0 = 66,67', () => {
    const e = ok16(L16_ALAP)
    dia(e.g, '9%')
    dia(e.DIV1, '2')
    expect(e.veges).toBe(true)
    dia(e.P0!, '66,67')
    expect(e.P0).toBeCloseTo(2 / (0.12 - 0.09), 9)
    expect(e.dpEll).toBeCloseTo(0.4, 12)
  })

  it('ROE = r esetén P_0 = EPS_1 / r, dp-től függetlenül', () => {
    const r = 0.12
    for (const dp of [0.05, 0.2, 0.4, 0.75, 1]) {
      const e = ok16({ ...L16_ALAP, ROE: r, r, dp })
      expect(e.P0).toBeCloseTo(5 / r, 9)
    }
    // és minden görbe dp = 1-nél EPS_1 / r-ben ér véget (g = 0)
    for (const roe of [0.05, 0.12, 0.3]) expect(arDpbol(roe, 1, 0.12, 5)).toBeCloseTo(5 / 0.12, 9)
  })

  it('ROE > r: a dp csökkenésével (több visszatartás) P_0 nő', () => {
    const ar = (dp: number) => arDpbol(0.15, dp, 0.12, 5)!
    const dpk = [0.9, 0.7, 0.5, 0.4, 0.3, 0.25, 0.22]
    for (let i = 1; i < dpk.length; i++) expect(ar(dpk[i])).toBeGreaterThan(ar(dpk[i - 1]))
  })

  it('ROE < r: a dp csökkenésével P_0 csökken (az osztalék többet ér)', () => {
    const ar = (dp: number) => arDpbol(0.09, dp, 0.12, 5)!
    const dpk = [0.05, 0.2, 0.4, 0.6, 0.8, 1]
    for (let i = 1; i < dpk.length; i++) expect(ar(dpk[i])).toBeGreaterThan(ar(dpk[i - 1]))
  })

  it('g ≥ r: nincs véges ár; a határ dp = 1 − r/ROE', () => {
    expect(dpHatar(0.15, 0.12)).toBeCloseTo(0.2, 12)
    const e = ok16({ ...L16_ALAP, dp: 0.1 })
    expect(e.veges).toBe(false)
    expect(e.P0).toBeUndefined()
    expect(arDpbol(0.15, 0.2, 0.12, 5)).toBeNull()
    expect(e.probak[3]).toBe(true)
    // a görbe a határ fölött kezdődik
    expect(e.gorbe[0][0]).toBeGreaterThan(0.2)
  })

  it('a három görbe sorrendje dp = 0,5-nél: ROE > r fölött, ROE = r, ROE < r alatt', () => {
    const e = ok16({ ...L16_ALAP, bovitett: true })
    const at = (i: number) => e.gorbek[i].pontok.find(([dp]) => Math.abs(dp - 0.5) < 1e-9)![1]
    expect(at(0)).toBeGreaterThan(at(1))
    expect(at(1)).toBeGreaterThan(at(2))
    expect(at(1)).toBeCloseTo(5 / 0.12, 9)
  })

  it('érvénytelen bemenet: hibaüzenet, nem kivétel', () => {
    for (const rossz of [{ ROE: 0 }, { r: 0 }, { EPS1: 0 }, { dp: -0.1 }, { dp: 1.1 }, { ROE: Number.NaN }]) {
      expect(l16({ ...L16_ALAP, ...rossz }).hiba).toEqual(expect.any(String))
    }
  })

  it('Próbáld ki feltételek', () => {
    expect(ok16(L16_ALAP).probak).toEqual([false, false, false, false])
    expect(ok16({ ...L16_ALAP, dp: 0.2 }).probak[3]).toBe(true)
    expect(ok16({ ...L16_ALAP, dp: 0.35 }).probak[0]).toBe(false)
    expect(ok16({ ...L16_ALAP, dp: 0.3 }).probak[0]).toBe(true)
    expect(ok16({ ...L16_ALAP, ROE: 0.12, dp: 0.7 }).probak[1]).toBe(true)
    expect(ok16({ ...L16_ALAP, ROE: 0.09, dp: 0.8 }).probak[2]).toBe(true)
  })
})
