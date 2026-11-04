import { describe, expect, it } from 'vitest'
import { ujFeladat } from '../../gyakorlas/motor.ts'
import { SABLONOK } from '../../gyakorlas/sablonok/index.ts'
import { zhOsszeallit } from '../sorsolas.ts'

// 2. fázis: a ZH legyen reális, a feltevések legyenek láthatók.

const wacc = SABLONOK.find((s) => s.id === 'wacc')!

describe('YTM: a ZH-ban mindig megadva, a gyakorlásban csak haladó módban számolt', () => {
  it('a ZH-szimulációban egyik feladatban sincs iterációs YTM-lépés', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const zh = zhOsszeallit(seed * 7907)
      for (const p of zh.szamitas) expect(p.feladat.lepesek.some((l) => l.key === 'ytm'), `#${seed}`).toBe(false)
      for (const k of zh.valasztos) expect(k.szoveg?.bekezdesek.join(' ') ?? '', `#${seed}`).not.toMatch(/lejáratáig \d+ év van hátra/)
    }
  })

  it('a gyakorlásban alapból nincs YTM-számolás, a haladó kapcsolóval van', () => {
    let alap = 0
    let halado = 0
    for (let seed = 1; seed <= 300; seed++) {
      if (ujFeladat(wacc, seed).lepesek.some((l) => l.key === 'ytm')) alap++
      if (ujFeladat(wacc, seed, { halado: true }).lepesek.some((l) => l.key === 'ytm')) halado++
    }
    expect(alap).toBe(0)
    expect(halado).toBeGreaterThan(50)
  })
})

import { eredmeny } from '../../gyakorlas/formaz.ts'
import { kiertekel, uresValaszok } from '../pontozas.ts'
import { feltetelezettSzabalyok, SZABALYOK, type ZhSzabalyok } from '../szabalyok.ts'

describe('a pontozás feltevései egy helyen (szabalyok.ts)', () => {
  /** Egy ZH, amelyben a számítási példák közül az első kettő többkulcsos és %-os. */
  function zhKeres() {
    for (let seed = 1; seed < 2000; seed++) {
      const zh = zhOsszeallit(seed)
      const i = zh.szamitas.findIndex((p) => p.kulcsok.length >= 2 && p.kulcsok.every((k) => p.feladat.lepesek.find((l) => l.key === k)?.tipus === 'szam'))
      if (i >= 0) return { zh, i }
    }
    throw new Error('nincs megfelelő ZH')
  }

  it('a kezdőoldal szövege jelzi, hogy a szabályok feltételezettek', () => {
    const sorok = feltetelezettSzabalyok(SZABALYOK)
    expect(sorok.join(' ')).toMatch(/minden kért érték/)
    expect(sorok.join(' ')).toMatch(/0,05 százalékpont/)
  })

  it('részpontozás: alapból csak a hibátlan példa ér pontot, a beállítással arányos', () => {
    const { zh, i } = zhKeres()
    const v = uresValaszok(zh)
    const p = zh.szamitas[i]
    const elso = p.kulcsok[0]
    const l = p.feladat.lepesek.find((x) => x.key === elso)!
    v.sz[i][elso] = eredmeny(p.feladat.ertekek[elso] as number, l.tipus === 'szam' ? l.egyseg : '%').replace(/ ?(%|M USD|USD)$/, '')
    expect(kiertekel(zh, v).pont.sz).toBe(0)
    const reszpontos: ZhSzabalyok = { ...SZABALYOK, szamitas: { ...SZABALYOK.szamitas, reszpont: true } }
    expect(kiertekel(zh, v, reszpontos).pont.sz).toBeCloseTo(SZABALYOK.szamitas.pont / p.kulcsok.length)
  })

  it('a százalékos tűrés a szabályfájlból jön', () => {
    for (let seed = 1; seed < 3000; seed++) {
      const zh = zhOsszeallit(seed)
      const i = zh.szamitas.findIndex((p) => p.kulcsok.length === 1 && p.feladat.lepesek.find((l) => l.key === p.kulcsok[0])?.tipus === 'szam' && p.feladat.turesek[p.kulcsok[0]] === undefined)
      if (i < 0) continue
      const p = zh.szamitas[i]
      const l = p.feladat.lepesek.find((x) => x.key === p.kulcsok[0])!
      if (l.tipus !== 'szam' || l.egyseg !== '%') continue
      const v = uresValaszok(zh)
      const elcsuszott = ((p.feladat.ertekek[p.kulcsok[0]] as number) + 0.0008) * 100
      v.sz[i][p.kulcsok[0]] = String(elcsuszott).replace('.', ',')
      expect(kiertekel(zh, v).sz[i].jo).toBe(false)
      const laza: ZhSzabalyok = { ...SZABALYOK, tures: { szazalekpont: 0.1 } }
      expect(kiertekel(zh, v, laza).sz[i].jo).toBe(true)
      return
    }
    throw new Error('nincs megfelelő ZH')
  })
})

import { feladatEllenoriz } from '../../gyakorlas/ellenorzes.ts'
import { DIAHIBAK, STATUSZOK } from '../../content/diahibak.ts'
import { szamOpciok } from '../sorsolas.ts'
import { rng } from '../../lib/rng.ts'
import type { SzamLepes } from '../../gyakorlas/tipusok.ts'

describe('Hibák a diákon: státusz, a nyitott tételeknél mindkét érték elfogadott', () => {
  it('minden tételnek van státusza; a CAPM-dia nyitott, a Gordon-példa számítással igazolt', () => {
    expect(DIAHIBAK.length).toBeGreaterThanOrEqual(7)
    for (const h of DIAHIBAK) expect(STATUSZOK, h.hol).toContain(h.statusz)
    expect(DIAHIBAK.find((h) => h.hol.includes('29. dia'))?.statusz).toBe('nyitott – kérdezd meg az oktatót')
    expect(DIAHIBAK.find((h) => h.hol.includes('Gordon'))?.statusz).toBe('számítással igazolva')
  })

  const elvart = SABLONOK.find((s) => s.id === 'capm-elvart')!
  function diasFeladat() {
    for (let seed = 1; seed < 500; seed++) {
      const f = ujFeladat(elvart, seed)
      if (f.p.dia) return f
    }
    throw new Error('nincs diás (4. ea, 29. dia) változat')
  }

  it('gyakorlás: a 29. dián alapuló feladatnál 10,8% és 11,8% is jó, és a visszajelzés jelzi, hogy a dia mást mutat', () => {
    const f = diasFeladat()
    expect(f.szoveg.bekezdesek.join(' ')).toMatch(/1,3/)
    for (const b of ['10,8', '11,8']) {
      const e = feladatEllenoriz(f, 'Er', b)
      expect(e.ok, b).toBe(true)
      expect(e.nyitott, b).toMatch(/29\. dia/)
    }
    expect(feladatEllenoriz(f, 'Er', '12,8').ok).toBe(false)
  })

  it('ZH: a 29. dián alapuló példánál mindkét érték pontot ér, és a feleletválasztós rossz opciói között nincs ott a másik érték', () => {
    const f = diasFeladat()
    const l = f.lepesek.find((x) => x.key === 'Er') as SzamLepes<unknown>
    for (let seed = 1; seed <= 50; seed++) {
      const o = szamOpciok(l, f.ertekek.Er as number, f, rng(seed))
      expect(o.opciok.filter((_x, i) => i !== o.helyes)).not.toContain('11,8%')
    }
    for (let seed = 1; seed < 5000; seed++) {
      const zh = zhOsszeallit(seed)
      const i = zh.szamitas.findIndex((p) => p.feladat.p.dia)
      if (i < 0) continue
      for (const b of ['10,8', '11,8']) {
        const v = uresValaszok(zh)
        v.sz[i].Er = b
        const k = kiertekel(zh, v)
        expect(k.sz[i].jo, b).toBe(true)
        expect(k.sz[i].megjegyzes, b).toMatch(/29\. dia/)
      }
      return
    }
    throw new Error('nincs diás feladat a ZH-kban')
  })
})

import { idoJovair, tempoOsszesit } from '../tempo.ts'

describe('tempó: idő szakaszonként és kérdésenként, a 75 mp fölöttiek jelölve', () => {
  it('az aktív kérdésre jóváírt időből szakaszösszeg és a lassú kérdések listája lesz', () => {
    let ido: Record<string, number> = {}
    ido = idoJovair(ido, 'ih-0', 20)
    ido = idoJovair(ido, 'ih-0', 10)
    ido = idoJovair(ido, 'mc-3', 80)
    ido = idoJovair(ido, 'sz-1', 140)
    ido = idoJovair(ido, null, 15)
    const o = tempoOsszesit(ido)
    expect(o.szakaszok).toEqual([
      { resz: 'ih', cim: 'I. Igaz-hamis', mp: 30 },
      { resz: 'mc', cim: 'II. Feleletválasztós', mp: 80 },
      { resz: 'sz', cim: 'III. Számítási', mp: 140 },
    ])
    expect(o.egyeb).toBe(15)
    expect(o.lassuk.map((l) => [l.kulcs, l.sorszam, l.mp])).toEqual([
      ['sz-1', 18, 140],
      ['mc-3', 12, 80],
    ])
  })
})
