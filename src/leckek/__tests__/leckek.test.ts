import { describe, expect, it } from 'vitest'
import { dia } from '../../calc/__tests__/dia.ts'
import { L01_ALAP, L01_KIS, L01_NAGY, M_SOR, l01, palya } from '../szamitas/l01.ts'
import { L02_ALAP, l02 } from '../szamitas/l02.ts'
import { L03_21A, L03_21B, L03_ALAP, l03 } from '../szamitas/l03.ts'
import { L04_ALAP, l04 } from '../szamitas/l04.ts'
import { L05_KT, L05_ROSS, l05, l05Palyak } from '../szamitas/l05.ts'
import { L06_3EA, L06_5EA, l06, l06Cml, l06Felho } from '../szamitas/l06.ts'
import { L07_ALAP, l07 } from '../szamitas/l07.ts'
import { L08_AB, L08_GH, l08 } from '../szamitas/l08.ts'
import { L09_4EA, L09_VIDEO, l09 } from '../szamitas/l09.ts'
import { L10_ALAP, l10 } from '../szamitas/l10.ts'
import { L11_5EA, L11_VIDEO, l11 } from '../szamitas/l11.ts'
import { L12_ALAP, l12 } from '../szamitas/l12.ts'

// Minden lecke a diás példával indul: az alapértékekkel kijelzett számok a képlettár számai.

describe('1. lecke: számtani, mértani és folytonos átlag', () => {
  const e = l01(L01_ALAP)
  const nagy = e.palyak[0]
  const kis = e.palyak[1]
  if (nagy.hiba || kis.hiba) throw new Error()

  it('nagy ingadozás, 1.3 példa (1. ea): 100 → 200 → 100 → 25%, 0%, 0%', () => {
    expect(nagy.arak).toEqual(L01_NAGY)
    dia(nagy.szamtani, '25%')
    dia(nagy.mertani, '0%', 1e-12)
    dia(nagy.folytonos, '0%', 1e-12)
    expect(nagy.index).toEqual([1, 2, 1])
  })

  it('kis ingadozás, 1.4 példa #1 (2. ea): 2,73%, 2,47%, 2,44%; r_c1 = 9,53%, r_c2 = −4,65%', () => {
    expect(kis.arak).toEqual(L01_KIS)
    dia(kis.szamtani, '2,73%')
    dia(kis.mertani, '2,47%')
    dia(kis.folytonos, '2,44%')
    dia(kis.rc[0], '9,53%')
    dia(kis.rc[1], '−4,65%')
  })

  it('1.4 példa #2 (2. ea): 100 → 50 → 75 → 37,5 → 56,25 → 0, −13,4%, −14,4%', () => {
    const p = palya([100, 50, 75, 37.5, 56.25])
    if (p.hiba) throw new Error()
    dia(p.szamtani, '0', 1e-12)
    dia(p.mertani, '−13,4%')
    dia(p.folytonos, '−14,4%')
  })

  it('a mértani és a folytonos átlag pályája a záró árfolyamba fut, a számtanié fölé (levezetés: 1.3, 1.4)', () => {
    for (const p of [nagy, kis]) {
      expect(p.mertaniPalya.at(-1)![1]).toBeCloseTo(p.arak.at(-1)!, 9)
      expect(p.szamtaniVeg).toBeGreaterThan(p.arak.at(-1)!)
      // r_c = ln(1 + r̄_g)
      expect(p.folytonos).toBeCloseTo(Math.log1p(p.mertani), 12)
    }
    dia(nagy.szamtaniVeg, '156,25')
  })

  it('a 30. dia sora és a 31. dia görbéi', () => {
    expect(e.mSor.map((x) => x.m)).toEqual(M_SOR.map((x) => x.m))
    dia(e.mSor[2].ertek, '2,4414')
    dia(e.mSor[3].ertek, '2,613')
    expect(e.ptGorbek.map((g) => g.pontok[0][1])).toEqual([100, 100, 100])
    dia(e.P1, '122,14')
    dia(e.egyevesHozam, '22,14%')
  })

  it('a „Próbáld ki” feltételek', () => {
    expect(e.probak).toEqual([false, false, false])
    expect(l01({ ...L01_ALAP, palyak: [[100, 200, 90], L01_KIS] }).probak[0]).toBe(true)
    expect(l01({ ...L01_ALAP, palyak: [[100, 110, 121], L01_KIS] }).probak[1]).toBe(true)
    // egyetlen év hozama nem elég (ott a két átlag mindig egyenlő)
    expect(l01({ ...L01_ALAP, palyak: [[100, 110], L01_KIS] }).probak[1]).toBe(false)
    // 4 tizedesre e: óránként még 2,7181, percenként már 2,7183
    expect(l01({ ...L01_ALAP, mIdx: 6 }).probak[2]).toBe(false)
    expect(l01({ ...L01_ALAP, mIdx: 7 }).probak[2]).toBe(true)
  })

  it('nem pozitív árfolyamnál üzenet', () => {
    const p = palya([100, 0, 50])
    expect(p.hiba).toMatch(/pozitív/)
    expect(l01({ ...L01_ALAP, palyak: [[100, -5], L01_KIS] }).aktiv.hiba).toMatch(/pozitív/)
  })
})

describe('2. lecke: normális eloszlás és szigma-szabályok', () => {
  const e = l02(L02_ALAP)
  if (e.hiba) throw new Error(e.hiba)

  it('2.4 példa (jegyzet, Ross 12.11): 68%-os sáv −7,8% … 31,8%, 95%-os sáv −27,6% … 51,6%', () => {
    dia(e.savok[0].also, '−7,8%')
    dia(e.savok[0].felso, '31,8%')
    dia(e.savok[1].also, '−27,6%')
    dia(e.savok[1].felso, '51,6%')
  })

  it('a 99%-os sáv a 26. dia szerint −47,4% … 71,4%; a 95%-os sáv 79,2 százalékpont széles', () => {
    dia(e.savok[2].also, '−47,4%')
    dia(e.savok[2].felso, '71,4%')
    dia(e.savok[1].szelesseg, '79,2%')
  })

  it('a szemléltető minta 97 év, a rekeszek határai a fél-szigma pontok, és mind benne van', () => {
    expect(e.minta).toHaveLength(97)
    expect(e.rekeszek.reduce((s, r) => s + r.db, 0)).toBe(97)
    expect(e.rekeszek.some((r) => Math.abs(r.also - e.savok[0].also) < 1e-12)).toBe(true)
    // a minta arányai a 2.4 „kb.” értékeinek közelében
    expect(e.mintaArany[0]).toBeGreaterThan(0.55)
    expect(e.mintaArany[0]).toBeLessThan(0.8)
    expect(e.mintaArany[1]).toBeGreaterThan(0.88)
    // E és σ csak átskálázza a mintát: a sávokba eső arány nem változik
    const m = l02({ E: -0.05, sigma: 0.4 })
    if (m.hiba) throw new Error()
    expect(m.mintaArany).toEqual(e.mintaArany)
  })

  it('a „Próbáld ki” feltételek', () => {
    expect(e.probak).toEqual([false, false, false])
    const p1 = l02({ ...L02_ALAP, sigma: 0.396 })
    expect(!p1.hiba && p1.probak[0]).toBe(true)
    if (!p1.hiba) dia(p1.savok[1].szelesseg, '158,4%')
    const p2 = l02({ E: 0.15, sigma: 0.15 })
    expect(!p2.hiba && p2.probak[1]).toBe(true)
    const p3 = l02({ E: 0.12, sigma: 0.06 })
    expect(!p3.hiba && p3.probak[2]).toBe(true)
  })

  it('nem pozitív szórásnál üzenet', () => {
    expect(l02({ E: 0.12, sigma: 0 }).hiba).toMatch(/pozitív/)
    expect(l02({ E: 0.12, sigma: -0.1 }).hiba).toMatch(/pozitív/)
  })
})

describe('3. lecke: várható hozam és szórás állapotokból', () => {
  const e = l03(L03_ALAP)
  if (e.hiba !== undefined) throw new Error(e.hiba)

  it('2.2 példa (2. ea): 20% / 80%, 10% / 30% → E(r) = 26%, σ² = 0,0064, σ = 8%', () => {
    dia(e.E, '26%')
    dia(e.variancia, '0,0064')
    dia(e.szoras, '8%')
  })

  it('a kidolgozó táblázat sorai a képlettár szerint', () => {
    dia(e.sorok[0].elteres, '−16%')
    dia(e.sorok[0].negyzet, '0,0256')
    dia(e.sorok[0].sulyozott, '0,00512')
    dia(e.sorok[1].elteres, '4%')
    dia(e.sorok[1].negyzet, '0,0016')
    dia(e.sorok[1].sulyozott, '0,00128')
  })

  it('2.1 példa (2. ea): A 20%, B 25%; a szórásuk 10% és 45% (3.3 példa)', () => {
    const A = l03({ allapotok: L03_21A })
    const B = l03({ allapotok: L03_21B })
    if (A.hiba !== undefined || B.hiba !== undefined) throw new Error()
    dia(A.E, '20%')
    dia(B.E, '25%')
    dia(A.szoras, '10%')
    dia(B.szoras, '45%')
  })

  it('két állapotnál a σ(p₁) görbe 50%-nál a legnagyobb', () => {
    const g = e.p1Gorbe!
    const max = g.reduce((m, x) => (x[1] > m[1] ? x : m))
    expect(max[0]).toBeCloseTo(0.5, 9)
    dia(g[20][1], '8%')
  })

  it('a „Próbáld ki” feltételek', () => {
    expect(e.probak).toEqual([false, false, false])
    const p1 = l03({ allapotok: L03_21A })
    expect(p1.hiba === undefined && p1.probak[0] && p1.probak[1]).toBe(true)
    const p3 = l03({ allapotok: [{ p: 0.3, r: 0.05 }, { p: 0.7, r: 0.05 }] })
    expect(p3.hiba === undefined && p3.probak[2]).toBe(true)
  })

  it('ha a valószínűségek összege nem 1, vagy negatív, üzenet', () => {
    expect(l03({ allapotok: [{ p: 0.2, r: 0.1 }, { p: 0.7, r: 0.3 }] }).hiba).toBe('A valószínűségek összege most 90%; 1-nek kell lennie.')
    expect(l03({ allapotok: [{ p: -0.2, r: 0.1 }, { p: 1.2, r: 0.3 }] }).hiba).toMatch(/negatív/)
  })
})

describe('4. lecke: kételemű portfólió', () => {
  const e = l04(L04_ALAP)
  if (e.hiba) throw new Error(e.hiba)

  it('50/50 súlynál a 2. ea 19. diája: σ = 17,5%, E = 22,5%', () => {
    dia(e.valasztott.szoras, '17,5%')
    dia(e.valasztott.E, '22,5%')
  })

  it('a minimális szórású („A”) pont a képlettár 81,8%-a, σ = 0, E = 20,9%', () => {
    dia(e.min.a1, '81,8%')
    dia(e.min.szoras, '0%', 1e-9)
    dia(e.min.E, '20,9%')
  })

  it('a két végpont a két eszköz (20% / 10% és 25% / 45%)', () => {
    dia(e.gorbe[e.gorbe.length - 1].szoras, '10%')
    dia(e.gorbe[0].szoras, '45%')
  })

  it('az alsó ágon lévő pontnak van B₃ párja, a hatékonynak nincs', () => {
    expect(e.hatekony).toBe(true)
    const also = l04({ ...L04_ALAP, a: 0.9 })
    if (also.hiba) throw new Error()
    expect(also.hatekony).toBe(false)
    expect(also.b3!.szoras).toBeCloseTo(also.valasztott.szoras, 9)
    expect(also.b3!.E).toBeGreaterThan(also.valasztott.E)
  })

  it('a „Próbáld ki” feltételek', () => {
    const p1 = l04({ ...L04_ALAP, a: 0.45 / 0.55 })
    expect(!p1.hiba && p1.probak[0]).toBe(true)
    const p2 = l04({ ...L04_ALAP, k: 1 })
    expect(!p2.hiba && p2.probak[1]).toBe(true)
    const p3 = l04({ ...L04_ALAP, k: 0, a: 0.953 })
    expect(!p3.hiba && p3.probak[2]).toBe(true)
    expect(e.probak).toEqual([false, false, false])
  })

  it('érvénytelen szórásnál üzenet, nem összeomlás', () => {
    expect(l04({ ...L04_ALAP, s1: 0 }).hiba).toMatch(/pozitív/)
  })
})

describe('5. lecke: diverzifikáció', () => {
  it('képlettári alap: σ 42,5%, k 0,6 → n = 2-nél 38,0%; az alsó szint 32,9%', () => {
    const e = l05(L05_KT)
    if (e.hiba !== undefined) throw new Error(e.hiba)
    dia(e.szoras, '38,0%')
    dia(e.szint, '32,9%')
    // a két rész összege a teljes variancia
    expect(e.szisztematikusVar + e.diverzifikalhatoVar).toBeCloseTo(e.szoras ** 2, 12)
  })

  it('Ross 13.7 (3.5 példa, 3. ea): n = 10 → 23,93%, n = 1 → 49,24%, szint ≈ 19,2%', () => {
    const e = l05(L05_ROSS)
    if (e.hiba !== undefined) throw new Error(e.hiba)
    dia(e.szoras, '23,93%')
    dia(e.egy, '49,24%')
    dia(e.szint, '19,2%')
  })

  it('a szimulált portfólió szórása az n-nel csökken (szemléltető)', () => {
    const szoras = (x: number[]) => {
      const m = x.reduce((a, b) => a + b, 0) / x.length
      return Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1))
    }
    const egy = l05Palyak({ ...L05_KT, n: 1 })
    const sok = l05Palyak({ ...L05_KT, n: 100 })
    expect(egy.eszkozok).toHaveLength(100)
    expect(szoras(sok.portfolio)).toBeLessThan(szoras(egy.portfolio))
    expect(egy.portfolio).toEqual(egy.egy)
  })

  it('a „Próbáld ki” feltételek', () => {
    const e0 = l05(L05_KT)
    expect(e0.hiba === undefined && e0.probak).toEqual([false, false, false])
    const p1 = l05({ ...L05_KT, n: 50, k: 0 })
    expect(p1.hiba === undefined && p1.probak[0]).toBe(true)
    if (p1.hiba === undefined) dia(p1.szoras, '6,0%')
    const p11 = l05({ ...L05_KT, n: 11 })
    expect(p11.hiba === undefined && p11.probak[1]).toBe(true)
    const p12 = l05({ ...L05_KT, n: 12 })
    expect(p12.hiba === undefined && p12.probak[1]).toBe(false)
    const p3 = l05({ ...L05_ROSS, n: 63 })
    expect(p3.hiba === undefined && p3.probak[2]).toBe(true)
    const p3b = l05({ ...L05_ROSS, n: 64 })
    expect(p3b.hiba === undefined && p3b.probak[2]).toBe(false)
  })

  it('lehetetlen átlagos korrelációnál üzenet', () => {
    expect(l05({ ...L05_KT, n: 5, k: -0.3 }).hiba).toMatch(/nem lehetséges/)
    expect(l05({ ...L05_KT, n: 5, k: -0.25 }).hiba).toBeUndefined()
    expect(l05({ ...L05_KT, sigma: 0 }).hiba).toMatch(/pozitív/)
  })
})

describe('6. lecke: tőkeallokációs és tőkepiaci egyenes', () => {
  it('5.4 példa (3. ea): w = 25% → E(rP) = 11%, βP = 0,4; w = 150% → 26%, βP = 2,4', () => {
    const a = l06(L06_3EA)
    if (a.hiba !== undefined) throw new Error()
    dia(a.E, '11%')
    dia(a.beta, '0,4')
    expect(a.hitel).toBe(false)
    const b = l06({ ...L06_3EA, w: 1.5 })
    if (b.hiba !== undefined) throw new Error()
    dia(b.E, '26%')
    dia(b.beta, '2,4')
    expect(b.hitel).toBe(true)
    // szemléltető σ(rA) = 25% mellett σ(rP) = w·σ(rA)
    dia(a.szoras, '6,25%')
  })

  it('5.4 példa (5. ea): E(rP) = 9% → w = 0,625, βP = 0,75', () => {
    const e = l06({ ...L06_5EA, w: 0.625 })
    if (e.hiba !== undefined) throw new Error()
    dia(e.E, '9%')
    dia(e.beta, '0,75')
    expect(e.probak[1]).toBe(true)
  })

  it('a tőkepiaci egyenes érintési pontja a 4. lecke görbéjén van, és ott a legmeredekebb', () => {
    const c = l06Cml(L06_3EA)
    for (const g of c.gorbe) expect((g.E - 0.08) / g.szoras).toBeLessThanOrEqual(c.M.meredekseg + 1e-9)
    expect(c.M.a1).toBeGreaterThan(0)
    expect(c.M.a1).toBeLessThan(1)
    // a szemléltető pontfelhő egyik pontja sem lehet a CML fölött
    const f = l06Felho(c.gorbe)
    for (const [sg, E] of [...f.korok, ...f.xek]) expect(E).toBeLessThan(0.08 + c.M.meredekseg * sg)
  })

  it('a „Próbáld ki” feltételek', () => {
    const e = l06(L06_3EA)
    expect(e.hiba === undefined && e.probak).toEqual([false, false, false])
    const p1 = l06({ ...L06_3EA, w: 1.5 })
    expect(p1.hiba === undefined && p1.probak[0]).toBe(true)
    const p3 = l06({ ...L06_3EA, w: 0.625 })
    expect(p3.hiba === undefined && p3.probak[2]).toBe(true)
    const p2 = l06(L06_5EA)
    expect(p2.hiba === undefined && p2.probak[1]).toBe(false)
  })

  it('nem pozitív szórásnál üzenet', () => {
    expect(l06({ ...L06_3EA, sA: 0 }).hiba).toMatch(/pozitív/)
  })
})

describe('7. lecke: karakterisztikus egyenes és kockázatfelbontás', () => {
  const e = l07(L07_ALAP)
  if (e.hiba !== undefined) throw new Error(e.hiba)

  it('4.3 a szemléltető alapértékekkel: piaci 0,0576, egyedi 0,0625, teljes 0,1201', () => {
    expect(e.piaci).toBeCloseTo(1.44 * 0.04, 12)
    expect(e.egyedi).toBeCloseTo(0.0625, 12)
    expect(e.teljes).toBeCloseTo(0.1201, 12)
    expect(e.szoras).toBeCloseTo(Math.sqrt(0.1201), 12)
  })

  it('4.1 minden pont r_i = β r_M + ε; a becsült béta közel van a beállítotthoz', () => {
    e.ri.forEach((r, t) => expect(r).toBeCloseTo(1.2 * e.rM[t] + e.eps[t], 12))
    expect(Math.abs(e.becsultBeta - 1.2)).toBeLessThan(0.02)
  })

  it('σ(ε) = 0-nál minden pont az egyenesen van, a becsült béta pontosan β', () => {
    const n = l07({ ...L07_ALAP, sE: 0 })
    if (n.hiba !== undefined) throw new Error()
    expect(n.becsultBeta).toBeCloseTo(1.2, 10)
    expect(n.korrelacio).toBeCloseTo(1, 10)
    expect(n.probak[1]).toBe(true)
  })

  it('a „Próbáld ki” feltételek', () => {
    expect(e.probak).toEqual([false, false, false])
    const p1 = l07({ ...L07_ALAP, sE: 0.45 })
    expect(p1.hiba === undefined && p1.probak[0]).toBe(true)
    const p3 = l07({ ...L07_ALAP, beta: 0 })
    expect(p3.hiba === undefined && p3.probak[2] && p3.piaci === 0).toBe(true)
  })

  it('érvénytelen szórásnál üzenet', () => {
    expect(l07({ ...L07_ALAP, sM: 0 }).hiba).toMatch(/pozitív/)
    expect(l07({ ...L07_ALAP, sE: -0.1 }).hiba).toMatch(/negatív/)
  })
})

describe('8. lecke: SML és árazottság', () => {
  it('G és H (5. ea 26–27. dia): SML-meredekség 6,5%, G 12,4% túlárazott, H 7,2% alulárazott', () => {
    const e = l08(L08_GH)
    dia(e.MRP, '6,5%')
    const [G, H] = e.eszkozok
    dia(G.elvart!, '12,4%')
    dia(G.meredekseg, '6,25%')
    expect(G.arazas).toBe('túlárazott')
    dia(H.elvart!, '7,2%')
    dia(H.meredekseg, '8,75%')
    expect(H.arazas).toBe('alulárazott')
  })

  it('A és B (4. ea 13–14. dia): meredekség 0,075 és 0,0667, SML nincs', () => {
    const e = l08(L08_AB)
    expect(e.vanSml).toBe(false)
    dia(e.eszkozok[0].meredekseg, '0,075')
    dia(e.eszkozok[1].meredekseg, '0,0667')
  })

  it('a „Próbáld ki”: G az SML-re húzva (12,4%) teljesül', () => {
    const e = l08({ ...L08_GH, eszkozok: [{ nev: 'G', beta: 1.6, E: 0.124 }, L08_GH.eszkozok[1]] })
    expect(e.probak[0]).toBe(true)
    expect(e.eszkozok[0].arazas).toBe('helyesen árazott')
  })
})

describe('9. lecke: osztalékmodell érzékenysége', () => {
  it('7.1 példa (4. ea): D₁ = 4,24, r_E = 13,07%; a második grafikonon g = 6%-nál P₀ = 60', () => {
    const e = l09(L09_4EA)
    if (e.hiba !== undefined) throw new Error()
    dia(e.D1, '4,24')
    dia(e.rE, '13,07%')
    dia(e.ar!, '60', 1e-9)
  })

  it('7.1 példa (videó): D₁ = 5,2, r_E = 11,43%', () => {
    const e = l09(L09_VIDEO)
    if (e.hiba !== undefined) throw new Error()
    dia(e.D1, '5,2')
    dia(e.rE, '11,43%')
  })

  it('g → r_E: P₀ elszáll; g ≥ r_E-nél nincs ár', () => {
    const kozel = l09({ ...L09_4EA, g: 0.125 })
    const tavol = l09(L09_4EA)
    if (kozel.hiba !== undefined || tavol.hiba !== undefined) throw new Error()
    expect(kozel.ar!).toBeGreaterThan(10 * tavol.ar!)
    const tul = l09({ ...L09_4EA, g: 0.14 })
    expect(tul.hiba === undefined && tul.ar).toBeNull()
  })

  it('a „Próbáld ki” feltételek', () => {
    const e = l09(L09_4EA)
    expect(e.hiba === undefined && e.probak).toEqual([false, false, false])
    const p1 = l09({ ...L09_4EA, g: 0.125 })
    expect(p1.hiba === undefined && p1.probak[0]).toBe(true)
    const p2 = l09({ ...L09_4EA, D0: 8 })
    expect(p2.hiba === undefined && p2.probak[1]).toBe(true)
    if (p2.hiba === undefined) dia(p2.rE, '20,13%')
    const p3 = l09({ ...L09_4EA, g: 0.0833 / 1.0667 })
    expect(p3.hiba === undefined && p3.probak[2]).toBe(true)
  })

  it('nem pozitív árfolyamnál vagy osztaléknál üzenet', () => {
    expect(l09({ ...L09_4EA, P0: 0 }).hiba).toMatch(/pozitív/)
    expect(l09({ ...L09_4EA, D0: 0 }).hiba).toMatch(/pozitív/)
  })
})

describe('11. lecke: WACC összetétele', () => {
  it('7.4 példa (5. ea): E/V 0,8576, r_E 13,18%, r_D adózás után 8,69%, WACC 12,54%', () => {
    const e = l11(L11_5EA)
    if (e.hiba !== undefined) throw new Error()
    dia(L11_5EA.wE, '0,8576')
    dia(L11_5EA.rE, '13,18%')
    dia(e.rDu, '8,69%')
    dia(e.wD, '0,1424')
    dia(e.WACC, '12,54%')
    expect(e.tagE + e.tagD).toBeCloseTo(e.WACC, 12)
  })

  it('7.4 példa (videó): r_E 12,4%, E/V 0,7874, WACC 11,1%', () => {
    const e = l11(L11_VIDEO)
    if (e.hiba !== undefined) throw new Error()
    dia(L11_VIDEO.rE, '12,4%')
    dia(L11_VIDEO.wE, '0,7874')
    dia(e.WACC, '11,1%')
  })

  it('adópajzs nélkül (T_C = 0) a WACC 12,87%, a különbség D/V · r_D · T_C ≈ 0,33 százalékpont', () => {
    const e = l11({ ...L11_5EA, Tc: 0 })
    if (e.hiba !== undefined) throw new Error()
    dia(e.WACC, '12,87%')
    const a = l11(L11_5EA)
    if (a.hiba !== undefined) throw new Error()
    dia(a.adopajzs, '0,33%')
    expect(a.adopajzs).toBeCloseTo(a.wD * L11_5EA.rD * L11_5EA.Tc, 12)
    expect(e.probak[0]).toBe(true)
  })

  it('a „Próbáld ki” feltételek', () => {
    const e = l11(L11_5EA)
    expect(e.hiba === undefined && e.probak).toEqual([false, false, false])
    const p2 = l11({ ...L11_5EA, wE: (0.12 - 0.0869) / (0.1318 - 0.0869) })
    expect(p2.hiba === undefined && p2.probak[1]).toBe(true)
    const p3 = l11({ ...L11_5EA, wE: 1 })
    expect(p3.hiba === undefined && p3.probak[2] && p3.WACC).toBeCloseTo(L11_5EA.rE, 12)
  })

  it('érvénytelen súlynál vagy adókulcsnál üzenet', () => {
    expect(l11({ ...L11_5EA, wE: 1.2 }).hiba).toMatch(/súly/)
    expect(l11({ ...L11_5EA, Tc: 1 }).hiba).toMatch(/adókulcs/)
  })
})

describe('12. lecke: WACC vagy projekt-CAPM', () => {
  const e = l12(L12_ALAP)

  it('7.5 példa (5. ea): WACC 15%; A: CAPM 11,8%, a WACC elutasítaná, helyes az elfogadás; B: 16,6%, fordítva', () => {
    dia(e.WACC, '15%')
    const [A, B] = e.projektek
    dia(A.elvart, '11,8%')
    expect(A.waccDontes).toBe('elutasítjuk')
    expect(A.capmDontes).toBe('elfogadjuk')
    expect(A.tipus).toBe('téves elutasítás')
    dia(B.elvart, '16,6%')
    expect(B.waccDontes).toBe('elfogadjuk')
    expect(B.capmDontes).toBe('elutasítjuk')
    expect(B.tipus).toBe('téves elfogadás')
    expect(e.tevesek).toBe(2)
  })

  it('a „Próbáld ki” feltételek', () => {
    expect(e.probak).toEqual([false, false, false])
    const p1 = l12({ ...L12_ALAP, projektek: [{ nev: 'A', beta: 0.6, E: 0.17 }, L12_ALAP.projektek[1]] })
    expect(p1.probak[0]).toBe(true)
    const p2 = l12({ ...L12_ALAP, projektek: [L12_ALAP.projektek[0], { nev: 'B', beta: 0.8, E: 0.14 }] })
    expect(p2.probak[1]).toBe(true)
    // β = 1-nél az elvárt hozam éppen a WACC, a két szabály egyezik
    const p3 = l12({ ...L12_ALAP, projektek: [{ nev: 'A', beta: 1, E: 0.14 }, L12_ALAP.projektek[1]] })
    expect(p3.probak[2]).toBe(true)
    expect(p3.projektek[0].teves).toBe(false)
  })
})

describe('10. lecke: NPV-profil és IRR', () => {
  it('a 4. ea projektje: NPV 12 627,41 (12%), IRR 16,13%, elfogadjuk', () => {
    const e = l10(L10_ALAP)
    dia(e.NPV, '12 627,41')
    dia(e.IRR!, '16,13%')
    expect(e.dontes).toBe('elfogadjuk')
    expect(e.uzenet).toBeUndefined()
  })

  it('a „Próbáld ki”: r = IRR, illetve CF0 ≈ −177 627 mellett 12%-on NPV ≈ 0', () => {
    expect(l10({ ...L10_ALAP, r: 0.1613 }).probak[0]).toBe(true)
    expect(l10({ ...L10_ALAP, cf: [-177627, 63120, 70800, 91080] }).probak[1]).toBe(true)
  })

  it('előjelváltás nélkül nincs IRR, de a profil megmarad', () => {
    const e = l10({ cf: [100, 50, 20], r: 0.1 })
    expect(e.IRR).toBeNull()
    expect(e.uzenet).toMatch(/Nincs IRR/)
    expect(e.profil.length).toBeGreaterThan(10)
  })
})

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { L04_NEVEK } from '../szamitas/l04.ts'
import { l06Nev } from '../szamitas/l06.ts'

describe('jelölések a diák szerint', () => {
  const forras = (f: string) => readFileSync(fileURLToPath(new URL(`../${f}`, import.meta.url)), 'utf8')

  it('4. lecke: a részvények A és B (2. ea), a minimális szórású pont „Min σ”', () => {
    expect(L04_NEVEK).toEqual({ r1: 'A', r2: 'B', min: 'Min σ' })
    const l04 = forras('l04-portfolio.tsx')
    expect(l04).not.toMatch(/cimke="[12A]"/)
    expect(l04).not.toMatch(/[12]\. eszköz/)
    expect(l04).not.toMatch(/„A” \(min/)
  })

  it('6. lecke: a kockázatos eszköz neve a beállított példáé (3. ea: A, 5. ea: D)', () => {
    expect(l06Nev('3ea')).toBe('A')
    expect(l06Nev('5ea')).toBe('D')
    expect(forras('l06-cal.tsx')).not.toMatch(/cimke="A \(w = 100%\)"/)
  })
})
