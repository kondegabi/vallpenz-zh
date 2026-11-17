import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { feladatEllenoriz } from '../gyakorlas/ellenorzes.ts'
import { ujFeladat } from '../gyakorlas/motor.ts'
import { SABLONOK } from '../gyakorlas/sablonok/index.ts'
import { MO_EMPEC, millerOrr } from '../leckek/szamitas/l15.ts'
import { ALLITASOK } from '../zh/allitasok.ts'
import { ELMELETI } from '../zh/elmeleti.ts'

// A 9–10. fejezet átnézésének (Fable) javításai: mindegyikhez egy teszt, amely a hibát megfogja.

const md = readFileSync(fileURLToPath(new URL('../../keplettar.md', import.meta.url)), 'utf8')
const lecke15 = readFileSync(fileURLToPath(new URL('../leckek/l15-penzallomany.tsx', import.meta.url)), 'utf8')
const sablon = (id: string) => SABLONOK.find((s) => s.id === id)!

describe('gyakorlás: minden kérdésnek van lépése', () => {
  it.each([
    ['baumol', ['C', 'Lnap']],
    ['osztalek-novekedes', ['g', 'P0']],
  ] as const)('%s: a szöveg mindkét kérdéséhez van ellenőrzött lépés', (id, kulcsok) => {
    for (let seed = 1; seed <= 200; seed++) {
      const f = ujFeladat(sablon(id), seed)
      expect(f.szoveg.kerdesek, `${id} #${seed}`).toHaveLength(kulcsok.length)
      for (const k of kulcsok) expect(f.lepesek.some((l) => l.key === k), `${id} #${seed}: ${k}`).toBe(true)
    }
  })
})

describe('tipikus hibák: az érték és az üzenet ugyanazt a tévedést írja le', () => {
  function hibak(id: string, kulcs: string, felt: (p: Record<string, unknown>) => boolean) {
    for (let seed = 1; seed <= 300; seed++) {
      const f = ujFeladat(sablon(id), seed)
      if (felt(f.p)) return { f, h: f.tipikusHibak[kulcs] }
    }
    throw new Error(`nincs megfelelő feladat: ${id}`)
  }

  it('Miller–Orr U*: a „sáv közepe” tévedés értéke 2C* − L, az „L kimaradt” értéke 3(C* − L)', () => {
    const { f, h } = hibak('miller-orr', 'U', (p) => p.kerdes === 'U')
    const C = f.ertekek.C as number
    const L = f.p.L as number
    expect(h.find((x) => /sáv közepe/.test(x.uzenet))?.ertek).toBeCloseTo(2 * C - L, 9)
    expect(h.find((x) => /elején álló L/.test(x.uzenet))?.ertek).toBeCloseTo(3 * (C - L), 9)
    expect(h.some((x) => Math.abs(x.ertek - (C + 2 * L)) < 1e-9)).toBe(false)
  })

  it('Miller–Orr átlag: a „két korlát átlaga” értéke (L + U*) / 2', () => {
    const { f, h } = hibak('miller-orr', 'atlag', (p) => p.kerdes === 'atlag')
    const C = f.ertekek.C as number
    const L = f.p.L as number
    expect(h.find((x) => /két korlát átlaga/.test(x.uzenet))?.ertek).toBeCloseTo((L + 3 * C - 2 * L) / 2, 9)
  })

  it('visszavásárlás: nincs kitöltő hiba (1 − NA/N), és van „rossz tulajdonostól levont” hiba', () => {
    const { f, h } = hibak('reszveny-muveletek', 'wA', (p) => p.mod === 'visszavasarlas')
    const { NA, N, Nv } = f.p as { NA: number; N: number; Nv: number }
    expect(h.some((x) => Math.abs(x.ertek - (1 - NA / N)) < 1e-12)).toBe(false)
    expect(h.some((x) => Math.abs(x.ertek - (NA - Nv) / (N - Nv)) < 1e-12)).toBe(true)
  })
})

describe('tűrés: a felfelé kerekített előző lépésből számolt érték is jó', () => {
  it('Baumol (13. dia): a 0,105 év (elfogadott L) napokban 38,3 is jó', () => {
    const f = ujFeladat(sablon('baumol'), 1)
    const p = { ...f.p }
    const d = SABLONOK.find((s) => s.id === 'baumol')!.diasPeldak[0].p
    const g = ujFeladat({ ...sablon('baumol'), general: () => ({ ...p, ...d }), ervenyes: () => true }, 1)
    expect(feladatEllenoriz(g, 'L', '0,105').ok).toBe(true)
    expect(feladatEllenoriz(g, 'Lnap', '38,3').ok).toBe(true)
  })

  it('Miller–Orr átlag: az egészre kerekített C*-ból számolt átlag is jó', () => {
    let db = 0
    for (let seed = 1; seed <= 300; seed++) {
      const f = ujFeladat(sablon('miller-orr'), seed)
      if (f.p.kerdes !== 'atlag') continue
      const C = Math.round(f.ertekek.C as number)
      const atlag = (4 * C - (f.p.L as number)) / 3
      expect(feladatEllenoriz(f, 'atlag', atlag.toFixed(2).replace('.', ',')).ok, `#${seed}`).toBe(true)
      db++
    }
    expect(db).toBeGreaterThan(20)
  })
})

describe('igaz-hamis és elméleti kérdések', () => {
  it('a növekedés melletti osztalékfizetés nem kétértelmű (13. dia: növekedés mellett is lehet osztalék)', () => {
    expect(ALLITASOK.some((a) => a.igaz === 'Ha van növekedési lehetőség, a vállalat nem fizet osztalékot.')).toBe(false)
    expect(ALLITASOK.find((a) => a.id === 'novekedes-nincs-osztalek')?.igaz).toMatch(/nincs növekedési lehetőség/)
  })

  it('az árfolyamesés az osztalék hatása, nem a fizetés napjáé (11. dia: az ex-dividend napon esik)', () => {
    expect(ALLITASOK.find((a) => a.id === 'keszpenzosztalek-arfolyam')?.igaz).not.toMatch(/fizetésekor/)
  })

  it('két állítás hamis alakja nem ugyanaz a tény', () => {
    const r = ALLITASOK.find((a) => a.id === 'reszvenyosztalek')!.hamis
    const v = ALLITASOK.find((a) => a.id === 'visszavasarlas-keszpenz')!.hamis
    expect(/részvényosztalék/i.test(r) && /részvényosztalék/i.test(v)).toBe(false)
  })

  it('az elméleti kérdések opciói a diákból jönnek', () => {
    const f = ELMELETI.find((k) => k.id === 'felaprozas-nem-valtozik')!
    expect(f.rosszak).not.toContain('Az egy részvényre jutó nyereség')
    const n = ELMELETI.find((k) => k.id === 'nem-keszpenzes')!
    expect([n.helyes, ...n.rosszak]).not.toContain('Rendkívüli osztalék fizetése')
  })
})

describe('képlettár és lecke: pontos szöveg', () => {
  it('a 9.2 „Magyarul” mondata, a 6. dia utalása és az ex-dividend esés', () => {
    expect(md).not.toContain('az alsó korlát, plus a')
    expect(md).toContain('A hosszú távú tervezés részletesen későbbi tantárgyakban')
    expect(md).toContain('nagyjából ennyivel esett')
  })

  it('a Hibák záró mondata a mostani táblát írja le, a 17. dia sora az átlagot is említi', () => {
    expect(md).not.toContain('Az első két sor számítási különbség; a többi elírás')
    expect(md).toContain('az átlag (4 × 411 − 100) / 3 = 514,67')
  })

  it('a 10.3 kiegészítése: a ROE a feladatokban adott adat', () => {
    expect(md).toContain('a ROE a feladatokban adott adat')
  })

  it('az EMPEC-eltérés oka: a dia lefelé kerekíti a C*-ot, és abból számolja az U*-ot (16. dia)', () => {
    expect(lecke15).not.toContain('a 16. dia r-je kerekített')
    const e = millerOrr(MO_EMPEC)
    if (e.hiba !== undefined) throw new Error(e.hiba)
    expect(Math.floor(e.C)).toBe(600616)
    expect(3 * Math.floor(e.C) - 2 * MO_EMPEC.L).toBe(1101848)
  })
})
