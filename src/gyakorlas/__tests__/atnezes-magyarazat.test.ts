import { describe, expect, it } from 'vitest'
import { ellenoriz, engedettElteres } from '../ellenorzes.ts'
import { eredmeny, sz } from '../formaz.ts'
import { kiertekelo, ujFeladat, type Feladat } from '../motor.ts'
import { SABLONOK, sablon } from '../sablonok/index.ts'
import type { Getter } from '../tipusok.ts'
import { egyenloTorlesztesKamatai } from '../../calc/tokeszerkezet.ts'

// Áttekintés utáni javítások: felismerés, tipikus hibák üzenetei, mondatsorrend, levezetések, mértékegységek.

const S = (id: string) => sablon(id)!
const szovegEgyben = (f: Feladat) => f.szoveg.bekezdesek.join(' ')
const SEEDEK = Array.from({ length: 200 }, (_, i) => i + 1)

function uzenetek(id: string, key: string, seedek = SEEDEK): string[] {
  return seedek.flatMap((seed) => ujFeladat(S(id), seed).tipikusHibak[key]?.map((h) => h.uzenet) ?? [])
}

describe('1. mm-ujrafinanszirozas: a felismerés a módtól függ', () => {
  it('tiszta saját tőkénél a csak 8.3-as sor (F16) a helyes, az F17 nem opció', () => {
    let tiszta = 0
    let hiteles = 0
    for (const seed of SEEDEK) {
      const f = ujFeladat(S('mm-ujrafinanszirozas'), seed)
      expect(f.felismeresek).toHaveLength(1)
      const fe = f.felismeresek[0]
      if (f.p.mod === 'tiszta') {
        tiszta++
        expect(fe.helyes, `#${seed}`).toBe('F16')
        expect(fe.opciok, `#${seed}`).not.toContain('F17')
      } else {
        hiteles++
        expect(fe.helyes, `#${seed}`).toBe('F17')
        expect(fe.opciok).toContain('F17')
      }
      expect(new Set(fe.opciok).size).toBe(4)
    }
    expect(tiszta).toBeGreaterThan(10)
    expect(hiteles).toBeGreaterThan(10)
  })
})

describe('2. osztalek-novekedes: most kifizetett osztalék', () => {
  it('a teljes EPS-es hiba üzenete most módban a DIV0-ból indul, nem dp × EPS1-et mond', () => {
    let talalt = 0
    for (const seed of SEEDEK) {
      const f = ujFeladat(S('osztalek-novekedes'), seed)
      const uz = f.tipikusHibak.P0.map((h) => h.uzenet).filter((u) => /teljes (nyereséggel|EPS)/.test(u))
      if (f.p.mod === 'most') {
        talalt += uz.length
        for (const u of uz) {
          expect(u).toContain('EPS = DIV0 / dp')
          expect(u).toContain('DIV1 = DIV0 × (1 + g)')
          expect(u).not.toContain('dp × EPS1')
        }
      } else {
        for (const u of uz) expect(u).toContain('DIV1 = dp × EPS1')
      }
    }
    expect(talalt).toBeGreaterThan(5)
  })

  it('a zavaró adat nem mond „tavaly fizetett osztalékot”', () => {
    for (const seed of Array.from({ length: 400 }, (_, i) => i + 1)) {
      const f = ujFeladat(S('osztalek-novekedes'), seed)
      expect(szovegEgyben(f), `#${seed}`).not.toMatch(/tavaly részvényenként/)
    }
  })
})

describe('3. osztalek-novekedes: P0 kérdésnél csak a P0 kérdés látszik a ZH-ban', () => {
  it('a zh() a P0-t kérdezi, a növekedési ütemet nem', () => {
    let p0 = 0
    for (const seed of SEEDEK) {
      const f = ujFeladat(S('osztalek-novekedes'), seed)
      const z = S('osztalek-novekedes').zh!(f.p)
      if (f.p.kerdes === 'P0') {
        p0++
        expect(z.kulcsok).toEqual(['P0'])
        expect(z.kerdesek, `#${seed}`).toEqual(['Mekkora a részvény értéke ma (P0)?'])
      } else {
        expect(z.kerdesek).toEqual(['Mekkora a fenntartható növekedési ütem?'])
      }
    }
    expect(p0).toBeGreaterThan(10)
  })
})

describe('4. a mondatsorrend nem szakítja szét a hivatkozó mondatpárt', () => {
  function elotte(szoveg: string, elso: string, masodik: string, hely: string) {
    const i = szoveg.indexOf(elso)
    const j = szoveg.indexOf(masodik)
    expect(i, `${hely}: hiányzik: ${elso}`).toBeGreaterThanOrEqual(0)
    expect(j, `${hely}: hiányzik: ${masodik}`).toBeGreaterThanOrEqual(0)
    expect(i, hely).toBeLessThan(j)
  }

  it('mm-tokekoltseg: a források listája előbb jön, mint „ugyanebben a sorrendben”', () => {
    let negy = 0
    for (const seed of SEEDEK) {
      const f = ujFeladat(S('mm-tokekoltseg'), seed)
      if (f.p.mod !== 'negy') continue
      negy++
      elotte(szovegEgyben(f), 'formájában finanszírozzák.', 'Az éves hozamok ugyanebben a sorrendben', `mm-tokekoltseg #${seed}`)
    }
    expect(negy).toBeGreaterThan(10)
  })

  it('tokeletes-piaci-muveletek: a „mindezt” mondat az osztalék és a beruházás után áll', () => {
    let kibocsatas = 0
    for (const seed of SEEDEK) {
      const f = ujFeladat(S('tokeletes-piaci-muveletek'), seed)
      if (f.p.mod !== 'kibocsatas') continue
      kibocsatas++
      const sz = szovegEgyben(f)
      elotte(sz, 'beruházást is végre kell hajtani.', 'Pénzeszköze nincs, ezért mindezt', `tokeletes-piaci #${seed}`)
      if (f.p.B > 0) elotte(sz, 'hitelt most egy összegben kell törlesztenie.', 'Pénzeszköze nincs, ezért mindezt', `tokeletes-piaci hitel #${seed}`)
    }
    expect(kibocsatas).toBeGreaterThan(10)
  })

  it('osztalek-szakaszos: a „visszatér” mondat az „nem fizet” után áll', () => {
    for (const seed of SEEDEK) {
      const f = ujFeladat(S('osztalek-szakaszos'), seed)
      elotte(szovegEgyben(f), 'nem fizet osztalékot, minden nyereséget visszaforgat.', 'múlva visszatér az osztalékfizetéshez', `osztalek-szakaszos #${seed}`)
    }
  })
})

describe('5. a tipikus hibák üzenetének szövege', () => {
  it('allapot: a hiányzó 2-es szorzót mondja, nem „kétszer szerepel”-t', () => {
    const mind = SABLONOK.filter((s) => s.csalad === 'allapot').flatMap((s) => SEEDEK.slice(0, 80).flatMap((seed) => Object.values(ujFeladat(s, seed).tipikusHibak).flat().map((h) => h.uzenet)))
    expect(mind.some((u) => u.includes('Kimaradt a keresztszorzat előtti 2-es szorzó: 2 × a1 × a2 × cov.'))).toBe(true)
    expect(mind.some((u) => u.includes('kétszer szerepel'))).toBe(false)
  })

  it('baumol: a hónapos üzenet az időközről szól', () => {
    const mind = uzenetek('baumol', 'Lnap')
    expect(mind).toContain('Ez az időköz hónapokban (év × 12); napokban: év × 365.')
    expect(mind.some((u) => u.includes('Ez hónapokban van'))).toBe(false)
  })

  it('mm-eszkozbeta: a felcserélt súlyokról szóló üzenet a bétákról beszél, nem a hozamról', () => {
    const mind = uzenetek('mm-eszkozbeta', 'bA')
    expect(mind).toContain('A súlyokat felcserélted: a saját tőke bétája a saját tőke súlyával, a hitelé a hitel súlyával szorzódik.')
    expect(mind.some((u) => u.includes('felcserélted') && u.includes('hozama'))).toBe(false)
  })
})

describe('6. adopajzs-veges: a törlesztős levezetés megmutatja a tartozást és a kamatokat', () => {
  it('az év eleji tartozások és a kamatok szerepelnek a levezetésben', () => {
    let torleszto = 0
    for (const seed of SEEDEK) {
      const f = ujFeladat(S('adopajzs-veges'), seed)
      const l = f.lepesek.find((x) => x.key === 'pv')!
      const get = kiertekelo(S('adopajzs-veges'), f.p) as Getter
      const lev = l.levezetes(f.p, get)
      if (f.p.mod !== 'torleszto') {
        expect(lev).not.toContain('Év eleji tartozás')
        continue
      }
      torleszto++
      const { D, n, rD } = f.p
      const tartozasok = Array.from({ length: n }, (_, i) => (D * (n - i)) / n)
      const kamatok = egyenloTorlesztesKamatai(D, n, rD)
      expect(lev, `#${seed}`).toContain(`Év eleji tartozás: ${tartozasok.map((x) => sz(x)).join('; ')} → kamat: ${kamatok.map((x) => sz(x)).join('; ')}`)
    }
    expect(torleszto).toBeGreaterThan(10)
  })
})

// ---- 7. a levezetésben kiírt számolás újra kiszámolva a kiírt eredményt adja ----

/** „12,5%” → törtként; a levezetésben kiírt szám (tizedesvessző, tagolás, −). */
function kiirtSzam(s: string): { ertek: number; tizedes: number; szazalek: boolean } | null {
  const t = s.replace(/[\s  ]/g, '').replace('−', '-').replace(/(M?USD|nap|év)$/, '')
  const m = /^(-?\d+(?:,(\d+))?)(%?)$/.exec(t)
  if (!m) return null
  return { ertek: Number(m[1].replace(',', '.')), tizedes: m[2]?.length ?? 0, szazalek: m[3] === '%' }
}

function kiertekel(kif: string): number | null {
  const js = kif
    .replace(/[  ]/g, '')
    .replace(/−/g, '-')
    .replace(/×/g, '*')
    .replace(/,/g, '.')
    .replace(/\^/g, '**')
    .replace(/(\d+(?:\.\d+)?)%/g, '($1/100)')
  if (!/^[\d.+\-*/()e]+$/.test(js)) return null
  try {
    return Function(`"use strict"; return (${js})`)() as number
  } catch {
    return null
  }
}

describe('7. a levezetés kiírt számai a kiírt eredményt adják', () => {
  it.each(['ados-tokekoltseg', 'mm-eszkozbeta', 'mm-ujrafinanszirozas'])('%s: a kiírt számolás újraszámolva egyezik a kiírt eredménnyel', (id) => {
    const s = S(id)
    let ellenorzott = 0
    for (let seed = 1; seed <= 300; seed++) {
      const f = ujFeladat(s, seed)
      const get = kiertekelo(s, f.p) as Getter
      for (const l of f.lepesek) {
        const lev = l.levezetes(f.p, get)
        const reszek = lev.split(' = ')
        if (reszek.length < 3) continue
        const vart = kiirtSzam(reszek[reszek.length - 1])
        const szamolt = kiertekel(reszek[reszek.length - 2])
        if (!vart || szamolt === null) continue
        ellenorzott++
        const skala = vart.szazalek ? 100 : 1
        const ulp = Math.pow(10, -vart.tizedes)
        expect(Math.abs(szamolt * skala - vart.ertek), `${id} #${seed} ${l.key}: ${lev}`).toBeLessThanOrEqual(0.52 * ulp)
      }
    }
    expect(ellenorzott).toBeGreaterThan(300)
  })
})

describe('8. a Baumol-lépések mértékegysége: nap és év', () => {
  it('az L lépés év, az Lnap lépés nap egységű', () => {
    const l = S('baumol').lepesek
    expect(l.find((x) => x.key === 'L')).toMatchObject({ egyseg: 'év' })
    expect(l.find((x) => x.key === 'Lnap')).toMatchObject({ egyseg: 'nap' })
  })

  it('a helyes válasz kiírása: nap 2, év 4 tizedessel, mértékegységgel', () => {
    expect(eredmeny(25.6893, 'nap')).toBe('25,69 nap')
    expect(eredmeny(0.0704, 'év')).toBe('0,0704 év')
  })

  it('a tűrés változatlan, és a mértékegységgel beírt válasz is elfogadott', () => {
    expect(engedettElteres(25.6893, 'nap', { abs: 0.2 })).toBeCloseTo(0.2, 9)
    expect(engedettElteres(0.0704, 'év', { abs: 0.0005 })).toBeCloseTo(0.0005, 9)
    expect(ellenoriz('25,69 nap', 25.6893, 'nap', { abs: 0.2 }).ok).toBe(true)
    expect(ellenoriz('25,5', 25.6893, 'nap', { abs: 0.2 }).ok).toBe(true)
    expect(ellenoriz('25,4', 25.6893, 'nap', { abs: 0.2 }).ok).toBe(false)
    expect(ellenoriz('0,0704 év', 0.0704, 'év', { abs: 0.0005 }).ok).toBe(true)
    expect(ellenoriz('0,0711', 0.0704, 'év', { abs: 0.0005 }).ok).toBe(false)
  })
})
