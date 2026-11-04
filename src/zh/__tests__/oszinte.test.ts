import { describe, expect, it } from 'vitest'
import { engedettElteres } from '../../gyakorlas/ellenorzes.ts'
import { ujFeladat } from '../../gyakorlas/motor.ts'
import { SABLONOK } from '../../gyakorlas/sablonok/index.ts'
import type { SzamLepes } from '../../gyakorlas/tipusok.ts'
import { rng } from '../../lib/rng.ts'
import { ALLITASOK, IGAZ_HAMIS_BANK } from '../allitasok.ts'
import { SAJAT_ALLITASOK } from '../sajat-allitasok.ts'
import { ELMELETI } from '../elmeleti.ts'
import { szamOpciok, zhOsszeallit } from '../sorsolas.ts'

// A ZH-szimuláció pontszáma a tudást mérje, ne a kérdés formájából kitalálható választ.

function szam(s: string): number {
  return Number(s.replace(/[^0-9,−-]/g, '').replace('−', '-').replace(',', '.'))
}

describe('elméleti feleletválasztós: a hossz nem árulja el a jó választ', () => {
  it('a jó válasz legfeljebb a kérdések negyedében a leghosszabb', () => {
    const leghosszabb = ELMELETI.filter((k) => k.helyes.length > Math.max(...k.rosszak.map((r) => r.length)))
    expect(leghosszabb.length, leghosszabb.map((k) => k.id).join(', ')).toBeLessThanOrEqual(Math.floor(ELMELETI.length / 4))
  })

  it('a jó válasz sehol sem hosszabb a legrövidebb rossz opció 1,5-szeresénél', () => {
    for (const k of ELMELETI) {
      const min = Math.min(...k.rosszak.map((r) => r.length))
      expect(k.helyes.length / min, `${k.id}: ${k.helyes.length} vs ${min}`).toBeLessThanOrEqual(1.5)
    }
  })
})

/** A számítási feleletválasztós kérdés lépése: az utolsó számszerű kérdezett érték (mint a sorsolásban). */
function mcLepes(s: (typeof SABLONOK)[number], seed: number) {
  const f = ujFeladat(s, seed)
  const kulcsok = s.zh!(f.p).kulcsok
  const l = [...f.lepesek].reverse().find((x) => x.tipus === 'szam' && kulcsok.includes(x.key)) as SzamLepes<unknown> | undefined
  return { f, l }
}

describe('számítási feleletválasztós: a rossz opciók valódi tipikus hibák', () => {
  it('minden ZH-képes sablon kérdezett lépésének legalább 3 tipikus hibája van, a helyestől elkülönülve', () => {
    for (const s of SABLONOK.filter((x) => x.zh)) {
      for (let seed = 1; seed <= 200; seed++) {
        const { f, l } = mcLepes(s, seed * 7919)
        if (!l) continue
        const helyes = f.ertekek[l.key] as number
        const kulon = (f.tipikusHibak[l.key] ?? []).filter(
          (h) => Number.isFinite(h.ertek) && Math.abs(h.ertek - helyes) > engedettElteres(helyes, l.egyseg, f.turesek[l.key]),
        )
        expect(kulon.length, `${s.id} #${seed} ${l.key}`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  // A két cél ütközik: a helyes érték csak akkor kerülhet a szélére, ha mindhárom rossz opció egy oldalon
  // van, ehhez viszont sok lépésnél nincs három egyoldali tipikus hiba. A rossz opciók legalább 80%-a
  // valódi tipikus hiba; a többi tartalék, és csak a hely kiegyenlítéséért kerül be.
  it('a rossz opciók legalább 80%-a tipikus hiba (a szorzós kitöltés csak tartalék)', () => {
    let ossz = 0
    let db = 0
    for (const s of SABLONOK.filter((x) => x.zh)) {
      for (let seed = 1; seed <= 200; seed++) {
        const { f, l } = mcLepes(s, seed * 7919)
        if (!l) continue
        ossz += szamOpciok(l, f.ertekek[l.key] as number, f, rng(seed)).tipikus
        db++
      }
    }
    expect(ossz / db / 3).toBeGreaterThanOrEqual(0.8)
  })

  it('a helyes érték nagyság szerint kb. az esetek felében esik a 2. vagy 3. helyre', () => {
    let kozep = 0
    let db = 0
    for (let seed = 1; seed <= 500; seed++) {
      const zh = zhOsszeallit(seed * 15485863)
      for (const k of zh.valasztos.filter((x) => x.fajta === 'szamitas')) {
        const ertekek = k.opciok.map(szam)
        const rang = [...ertekek].sort((a, b) => a - b).indexOf(ertekek[k.helyes])
        if (rang === 1 || rang === 2) kozep++
        db++
      }
    }
    expect(kozep / db).toBeGreaterThan(0.38)
    expect(kozep / db).toBeLessThan(0.6)
  })
})

/** Szószintű különbség az igaz és a hamis alak között: a megváltozott szakaszok (LCS alapján). */
function szakaszok(a: string, b: string): { ki: string[]; be: string[] }[] {
  const x = a.split(/\s+/)
  const y = b.split(/\s+/)
  const L = Array.from({ length: x.length + 1 }, () => new Array<number>(y.length + 1).fill(0))
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const ki: { ki: string[]; be: string[] }[] = []
  let akt: { ki: string[]; be: string[] } | null = null
  let i = 0
  let j = 0
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) {
      akt = null
      i++
      j++
      continue
    }
    if (!akt) ki.push((akt = { ki: [], be: [] }))
    if (j >= y.length || (i < x.length && L[i + 1][j] >= L[i][j + 1])) akt.ki.push(x[i++])
    else akt.be.push(y[j++])
  }
  return ki
}

describe('igaz-hamis: egyetlen pontos csere, valódi tévedés', () => {
  it('a sorsolás a saját állításokat is használja (közös bank, egyedi azonosítók)', () => {
    expect(IGAZ_HAMIS_BANK.map((a) => a.id)).toEqual([...ALLITASOK, ...SAJAT_ALLITASOK].map((a) => a.id))
    expect(new Set(IGAZ_HAMIS_BANK.map((a) => a.id)).size).toBe(IGAZ_HAMIS_BANK.length)
    for (const a of SAJAT_ALLITASOK) expect(a.forras.trim(), a.id).not.toBe('')
  })

  it('a hamis alak az igazból egy cserével (legfeljebb két helyen, pl. felcserélés) jön, helyenként legfeljebb 6 szó (a saját állításoknál is)', () => {
    for (const a of IGAZ_HAMIS_BANK) {
      const sz = szakaszok(a.igaz, a.hamis)
      expect(sz.length, `${a.id}: ${JSON.stringify(sz)}`).toBeGreaterThanOrEqual(1)
      expect(sz.length, `${a.id}: ${JSON.stringify(sz)}`).toBeLessThanOrEqual(2)
      for (const s of sz) {
        expect(s.ki.length, `${a.id}: ${s.ki.join(' ')} → ${s.be.join(' ')}`).toBeLessThanOrEqual(6)
        expect(s.be.length, `${a.id}: ${s.ki.join(' ')} → ${s.be.join(' ')}`).toBeLessThanOrEqual(6)
      }
    }
  })

  it('nincs nyilvánvaló képtelenség a hamis alakokban', () => {
    const kepetlen = [
      /hozamának szorzata/,
      /egyszerű átlaga, a valószínűségektől függetlenül/,
      /egyszerű, súlyozatlan átlaga/,
      /legkisebb várható hozamú/,
      /két elem bétájának egyszerű átlaga/,
      /pozitív, a projektet elutasítjuk/,
      /kockázatmentes hozam összege/,
      /kovariancia szorozva/,
    ]
    for (const a of ALLITASOK) for (const k of kepetlen) expect(a.hamis, a.id).not.toMatch(k)
  })
})
