import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ellenoriz } from '../../gyakorlas/ellenorzes.ts'
import { eredmeny } from '../../gyakorlas/formaz.ts'
import { ujFeladat } from '../../gyakorlas/motor.ts'
import { SABLONOK } from '../../gyakorlas/sablonok/index.ts'
import { ALLITASOK } from '../allitasok.ts'
import { ELMELETI } from '../elmeleti.ts'
import { igazHamisPont, kiertekel, MAX, szamitasPont, uresValaszok, valasztosPont, type Valaszok } from '../pontozas.ts'
import { IH_DB, MC_DB, SZ_DB, zhOsszeallit } from '../sorsolas.ts'

const md = readFileSync(fileURLToPath(new URL('../../../keplettar.md', import.meta.url)), 'utf8')

describe('kérdésbankok', () => {
  it('minden igaz-hamis állítás forrásrészlete szó szerint benne van a képlettárban', () => {
    for (const a of ALLITASOK) expect(md.includes(a.kulcs), `${a.id}: ${a.kulcs}`).toBe(true)
    expect(new Set(ALLITASOK.map((a) => a.id)).size).toBe(ALLITASOK.length)
    for (const a of ALLITASOK) expect(a.igaz, a.id).not.toBe(a.hamis)
  })

  it('minden elméleti kérdés jó válaszát a képlettár alátámasztja, és a négy opció különböző', () => {
    for (const k of ELMELETI) {
      expect(md.includes(k.kulcs), `${k.id}: ${k.kulcs}`).toBe(true)
      expect(new Set([k.helyes, ...k.rosszak]).size, k.id).toBe(4)
    }
  })

  it('a ZH-képes sablonok kérdezett kulcsai mindig aktív lépések', () => {
    for (const s of SABLONOK.filter((x) => x.zh)) {
      for (let seed = 1; seed <= 150; seed++) {
        const f = ujFeladat(s, seed)
        const zh = s.zh!(f.p)
        expect(zh.kulcsok.length, s.id).toBeGreaterThan(0)
        for (const k of zh.kulcsok) expect(f.lepesek.some((l) => l.key === k), `${s.id} #${seed} ${k}`).toBe(true)
        if (zh.kerdesek) expect(zh.kerdesek.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('pontozás', () => {
  it('igaz-hamis: 3 vagy kevesebb jó 0, 4 jó 2, minden további +2, 8 jó 10', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(igazHamisPont)).toEqual([0, 0, 0, 0, 2, 4, 6, 8, 10])
  })
  it('feleletválasztós 3, számítási 4 pont darabonként; a maximum 50', () => {
    expect(valasztosPont(8)).toBe(24)
    expect(szamitasPont(4)).toBe(16)
    expect(MAX.ih + MAX.mc + MAX.sz).toBe(50)
  })
})

/** A helyes válaszok, ahogy a felhasználó beírná (a kiírt alakkal). */
function jok(seed: number): Valaszok {
  const zh = zhOsszeallit(seed)
  return {
    ih: zh.igazHamis.map((k) => k.igaz),
    mc: zh.valasztos.map((k) => k.helyes),
    sz: zh.szamitas.map((p) =>
      Object.fromEntries(
        p.kulcsok.map((k) => {
          const l = p.feladat.lepesek.find((x) => x.key === k)!
          const v = p.feladat.ertekek[k]
          if (l.tipus !== 'szam') return [k, String(v)]
          // a kiírt alakból a szám (pl. „13,18%” → „13,18”)
          return [k, eredmeny(v as number, l.egyseg).replace(/ ?(%|M USD|USD)$/, '')]
        }),
      ),
    ),
  }
}

describe('ZH összeállítása', () => {
  it('300 véletlen ZH: helyes darabszámok, négy különböző opció, különböző családok, és a hibátlan kitöltés 50 pont', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const zh = zhOsszeallit(seed * 104729)
      expect(zh.igazHamis).toHaveLength(IH_DB)
      expect(zh.valasztos).toHaveLength(MC_DB)
      expect(zh.szamitas).toHaveLength(SZ_DB)
      for (const k of zh.valasztos) {
        expect(k.opciok, `#${seed} ${k.kerdes}`).toHaveLength(4)
        expect(new Set(k.opciok).size, `#${seed} ${k.kerdes}: ${k.opciok.join(' | ')}`).toBe(4)
        expect(k.helyes).toBeGreaterThanOrEqual(0)
        expect(k.opciok.join(' ')).not.toMatch(/\b[1-7]\.[1-5]\b/)
      }
      expect(new Set(zh.szamitas.map((p) => p.feladat.sablon.csalad)).size).toBe(SZ_DB)
      expect(new Set(zh.igazHamis.map((k) => k.allitas.id)).size).toBe(IH_DB)
      const e = kiertekel(zh, jok(seed * 104729))
      expect(e.pont.ossz, `#${seed}`).toBe(50)
      // üres lap: 0 pont
      expect(kiertekel(zh, uresValaszok(zh)).pont.ossz).toBe(0)
    }
  })

  it('ugyanabból a seedből ugyanaz a ZH', () => {
    const a = zhOsszeallit(42)
    const b = zhOsszeallit(42)
    expect(a.igazHamis.map((k) => k.szoveg)).toEqual(b.igazHamis.map((k) => k.szoveg))
    expect(a.valasztos.map((k) => k.opciok)).toEqual(b.valasztos.map((k) => k.opciok))
  })

  it('a jó válasz helye a feleletválasztósban egyenletes, az igaz-hamis arány vegyes', () => {
    const pos = [0, 0, 0, 0]
    let igaz = 0
    let ossz = 0
    for (let seed = 1; seed <= 400; seed++) {
      const zh = zhOsszeallit(seed * 7)
      for (const k of zh.valasztos) pos[k.helyes]++
      for (const k of zh.igazHamis) (igaz += k.igaz ? 1 : 0), ossz++
    }
    const n = pos.reduce((a, b) => a + b, 0)
    for (const p of pos) expect(p / n).toBeGreaterThan(0.2)
    expect(igaz / ossz).toBeGreaterThan(0.4)
    expect(igaz / ossz).toBeLessThan(0.6)
  })

  it('a számítási feleletválasztós rossz opciói a tűrésen túl vannak (nem fogadná el őket az ellenőrző)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const zh = zhOsszeallit(seed * 31)
      for (const k of zh.valasztos.filter((x) => x.fajta === 'szamitas')) {
        const jo = k.opciok[k.helyes]
        for (const [i, o] of k.opciok.entries()) {
          if (i === k.helyes) continue
          const egyseg = jo.endsWith('%') ? '%' : jo.endsWith('M USD') ? 'M USD' : jo.endsWith('USD') ? 'USD' : 'tizedes'
          const szam = (s: string) => s.replace(/ ?(%|M USD|USD)$/, '')
          const joErtek = Number(szam(jo).replace(/\s/g, '').replace('−', '-').replace(',', '.')) / (egyseg === '%' ? 100 : 1)
          expect(ellenoriz(szam(o), joErtek, egyseg).ok, `#${seed} ${k.kerdes}: ${o} vs ${jo}`).toBe(false)
        }
      }
    }
  })
})
