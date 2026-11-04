import { describe, expect, it } from 'vitest'
import { dia } from '../../calc/__tests__/dia.ts'
import { beolvas } from '../../lib/szam.ts'
import { KEPLET_IDK, KT } from '../../content/kepletter.ts'
import { ellenoriz, tipikusHiba } from '../ellenorzes.ts'
import { eredmeny } from '../formaz.ts'
import { aktivLepesek, kiertekelo, lancNevekkel, lepesTures, szakaszKepletei, tervKeszit, ujFeladat } from '../motor.ts'
import { SABLONOK } from '../sablonok/index.ts'
import type { AnySablon, Getter, SzamLepes } from '../tipusok.ts'

const FELISMERO_IDK = new Set(KT.felismero.sorok.map((s) => s.id))

/** A diás érték és a lépés tűrése közül a szigorúbb (a '−1' alak önmagában ±0,5-öt engedne). */
function diaLepessel(s: AnySablon, key: string, szamolt: number, diaAlak: string, p: unknown, get: Getter) {
  const l = aktivLepesek(s, p).find((x) => x.key === key) as SzamLepes<unknown>
  const tures = lepesTures(l, p, get)
  const b = beolvas(diaAlak)!
  const vart = b.szazalek ? b.ertek / 100 : b.ertek
  const diaTures = 0.5 * Math.pow(10, -(b.tizedesjegyek + (b.szazalek ? 2 : 0)))
  const lepesT = Math.max(tures?.abs ?? 0.0005, (tures?.rel ?? 0) * Math.abs(vart))
  dia(szamolt, diaAlak, Math.min(diaTures, lepesT) + 1e-12)
}

describe.each(SABLONOK.map((s) => [s.id, s] as const))('%s', (_id, s) => {
  it('van diás példája', () => {
    expect(s.diasPeldak.length).toBeGreaterThan(0)
  })

  it.each(s.diasPeldak.map((d) => [d.forras, d] as const))('diás példa: %s', (_f, d) => {
    const get = kiertekelo(s, d.p)
    for (const [key, vart] of Object.entries(d.vart)) {
      const v = get(key)
      if (typeof v === 'string') expect(v, key).toBe(vart)
      else diaLepessel(s, key, v, vart, d.p, get as Getter)
    }
  })

  it('a felismerés a felismerő tábla létező soraira mutat, ismétlés nélkül', () => {
    for (const f of s.felismeresek) {
      const opciok = [f.helyes, ...f.zavarok]
      expect(new Set(opciok).size).toBe(opciok.length)
      for (const o of opciok) expect(FELISMERO_IDK.has(o), o).toBe(true)
    }
  })

  it('a lépések létező képletekre hivatkoznak', () => {
    for (const l of s.lepesek) expect(KEPLET_IDK.has(l.formulaId), l.key).toBe(true)
  })

  it('400 véletlen feladat: érvényes paraméterek, véges eredmények, hibátlan szöveg', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const f = ujFeladat(s, seed)
      expect(s.ervenyes(f.p)).toBe(true)
      // egy feladaton belül a kulcsok egyediek
      expect(new Set(f.lepesek.map((l) => l.key)).size).toBe(f.lepesek.length)
      for (const l of f.lepesek) {
        const v = f.ertekek[l.key]
        if (l.tipus === 'szam') {
          expect(Number.isFinite(v), `${s.id} #${seed} ${l.key}`).toBe(true)
          // a saját helyes válaszát (kiírt alakban) elfogadja az ellenőrzés
          const kiirt = eredmeny(v as number, l.egyseg).replace(/ (M )?USD$/, '')
          expect(ellenoriz(kiirt, v as number, l.egyseg, f.turesek[l.key]).ok, `${s.id} #${seed} ${l.key}: ${kiirt}`).toBe(true)
        } else {
          expect(l.opciok).toContain(v)
        }
        const lev = l.levezetes(f.p, ((k: string) => f.ertekek[k]) as (k: string) => number)
        expect(lev, `${s.id} #${seed} ${l.key}`).not.toMatch(/NaN|undefined|Infinity/)
      }
      const szoveg = [...f.szoveg.bekezdesek, ...f.szoveg.kerdesek, ...(f.szoveg.tabla?.sorok.flat() ?? [])].join(' ')
      expect(szoveg, `${s.id} #${seed}`).not.toMatch(/NaN|undefined|Infinity|\bnull\b/)
      // a felismerések a feladat aktív lépései előtt vannak
      for (const fe of f.felismeresek) {
        if (fe.elott) expect(f.lepesek.some((l) => l.key === fe.elott)).toBe(true)
        expect(fe.opciok).toHaveLength(fe.zavarok.length + 1)
      }
    }
  })

  it('ugyanabból a seedből ugyanaz a feladat', () => {
    const a = ujFeladat(s, 12345)
    const b = ujFeladat(s, 12345)
    expect(a.szoveg).toEqual(b.szoveg)
    expect(a.ertekek).toEqual(b.ertekek)
  })
})

describe('A feladat menete', () => {
  it('a B4-ben két felismerés van: az elején és a portfólió előtt', () => {
    const b4 = SABLONOK.find((s) => s.id === 'allapot-teljes')!
    const f = ujFeladat(b4, 1)
    const terv = tervKeszit(f)
    expect(terv[0]).toEqual({ tipus: 'felismeres', i: 0 })
    const masodik = terv.findIndex((t) => t.tipus === 'felismeres' && t.i === 1)
    const kovetkezo = terv[masodik + 1]
    expect(kovetkezo.tipus === 'lepes' && f.lepesek[kovetkezo.i].key).toBe('EP')
    expect(szakaszKepletei(f, terv, 0)).toEqual(['2.1', '2.2', '3.2', '3.3'])
    expect(szakaszKepletei(f, terv, masodik)).toEqual(['3.1', '3.4'])
  })

  it('egy felismerésű feladatnál a felismerés az első elem', () => {
    for (const s of SABLONOK.filter((x) => x.felismeresek.length === 1)) {
      const terv = tervKeszit(ujFeladat(s, 3))
      expect(terv[0], s.id).toEqual({ tipus: 'felismeres', i: 0 })
      expect(terv.filter((t) => t.tipus === 'felismeres')).toHaveLength(1)
    }
  })
})

describe('Tipikus hibák', () => {
  it.each(SABLONOK.map((s) => [s.id, s] as const))('%s: a tipikus hibás érték beírva nem jó, és célzott üzenetet kap', (_id, s) => {
    let ellenorzott = 0
    for (let seed = 1; seed <= 150; seed++) {
      const f = ujFeladat(s, seed)
      for (const l of f.lepesek) {
        if (l.tipus !== 'szam') continue
        for (const h of f.tipikusHibak[l.key]) {
          expect(Number.isFinite(h.ertek), `${s.id} #${seed} ${l.key}`).toBe(true)
          const kiirt = eredmeny(h.ertek, l.egyseg).replace(/ (M )?USD$/, '')
          const e = ellenoriz(kiirt, f.ertekek[l.key] as number, l.egyseg, f.turesek[l.key])
          if (e.ok) continue // a hibás út itt véletlenül a helyes értéket adja
          ellenorzott++
          expect(tipikusHiba(e.ertek!, f.tipikusHibak[l.key], l.egyseg, f.turesek[l.key]), `${s.id} #${seed} ${l.key}: ${kiirt}`).toBeTruthy()
        }
      }
    }
    const vanTipikus = s.lepesek.some((l) => l.tipus === 'szam' && l.tipikusHibak)
    if (vanTipikus) expect(ellenorzott).toBeGreaterThan(0)
  })

  it('a historikus szórásnál az N-nel osztást célzottan jelzi, a helyes értéket nem', () => {
    const s = SABLONOK.find((x) => x.id === 'historikus-szoras')!
    const f = ujFeladat(s, 11)
    const n = f.p.r.length
    const negyzetosszeg = f.ertekek.negyzetosszeg as number
    expect(tipikusHiba(negyzetosszeg / n, f.tipikusHibak.var, 'tizedes', f.turesek.var)).toMatch(/N − 1/)
    expect(tipikusHiba(Math.sqrt(negyzetosszeg / n), f.tipikusHibak.sigma, '%', f.turesek.sigma)).toMatch(/N − 1/)
    expect(tipikusHiba(f.ertekek.var as number, f.tipikusHibak.var, 'tizedes', f.turesek.var)).toBeUndefined()
  })
})

describe('Tipikus válaszok', () => {
  it('a 7.5-ben a WACC-alapú döntés célzott üzenetet kap, és mindig van ilyen projekt', () => {
    const s = SABLONOK.find((x) => x.id === 'wacc-vagy-capm')!
    for (let seed = 1; seed <= 150; seed++) {
      const f = ujFeladat(s, seed)
      const dontesek = f.lepesek.filter((l) => l.tipus === 'valasztas')
      const csapdas = dontesek.filter((l) => f.tipikusValaszok[l.key].some((t) => t.valasz !== f.ertekek[l.key]))
      expect(csapdas.length, `#${seed}`).toBeGreaterThan(0)
    }
  })
})

describe('A sablonok együtt', () => {
  it.each([
    ['portfolio-beta', ['beta', 'hianyzo', 'suly']],
    ['kevert-portfolio', ['adott', 'cel']],
    ['atlaghozamok', ['egy', 'sor']],
  ])('%s: minden változat előfordul', (id, valtozatok) => {
    const s = SABLONOK.find((x) => x.id === id)!
    const lat = new Map<string, number>()
    for (let seed = 1; seed <= 300; seed++) {
      const v = String(ujFeladat(s, seed).p.valtozat ?? ujFeladat(s, seed).p.tipus)
      lat.set(v, (lat.get(v) ?? 0) + 1)
    }
    for (const v of valtozatok) expect(lat.get(v) ?? 0, `${id}: ${v} ${JSON.stringify([...lat])}`).toBeGreaterThan(30)
  })

  it('az NPV-feladatok között van elfogadandó és elutasítandó is, IRR-rel és anélkül', () => {
    const s = SABLONOK.find((x) => x.id === 'npv-irr')!
    const lat = new Set<string>()
    for (let seed = 1; seed <= 200; seed++) {
      const f = ujFeladat(s, seed)
      lat.add(String(f.ertekek.dontes))
      lat.add(f.p.irrIs ? 'irr' : 'npv')
    }
    expect(lat).toEqual(new Set(['elfogadjuk', 'elutasítjuk', 'irr', 'npv']))
  })

  it('mindhárom MVP-család megvan', () => {
    const csaladok = new Set(SABLONOK.map((s) => s.csalad))
    for (const c of ['capm', 'allapot', 'wacc'] as const) expect(csaladok.has(c), c).toBe(true)
  })

  it('a WACC-feladatok között van CAPM-es, D0-s, D1-es és (haladó módban) számolt YTM-es is', () => {
    const wacc = SABLONOK.find((s) => s.id === 'wacc')!
    const modok = new Set<string>()
    for (let seed = 1; seed <= 200; seed++) {
      const f = ujFeladat(wacc, seed, { halado: true })
      modok.add(f.p.reMod)
      modok.add(f.p.ytmMod)
    }
    expect(modok).toEqual(new Set(['capm', 'gordonD0', 'gordonD1', 'adott', 'szamolt']))
  })

  it('a zavaró adat néha megjelenik (WACC: kupon megadott YTM mellett)', () => {
    const wacc = SABLONOK.find((s) => s.id === 'wacc')!
    let van = 0
    for (let seed = 1; seed <= 100; seed++) {
      const f = ujFeladat(wacc, seed)
      if (f.p.ytmMod === 'adott' && f.szoveg.bekezdesek.join(' ').includes('kuponja')) van++
    }
    expect(van).toBeGreaterThan(10)
  })
})

describe('válaszlehetőségek', () => {
  it('a jó válasz minden pozícióban nagyjából egyforma gyakran áll (felismerés és döntés)', () => {
    const fel: number[] = [0, 0, 0, 0]
    const dont: Record<string, number[]> = {}
    for (const s of SABLONOK) {
      for (let seed = 1; seed <= 400; seed++) {
        const f = ujFeladat(s, seed * 7919)
        for (const fe of f.felismeresek) fel[fe.opciok.indexOf(fe.helyes)]++
        for (const l of f.lepesek) {
          if (l.tipus !== 'valasztas') continue
          const i = l.opciok.indexOf(String(f.ertekek[l.key]))
          const k = `${s.id}:${l.key}`
          dont[k] ??= Array(l.opciok.length).fill(0)
          dont[k][i]++
        }
      }
    }
    const osszes = fel.reduce((a, b) => a + b, 0)
    for (const db of fel) expect(db / osszes).toBeGreaterThan(0.2)
    // a döntős gombok sorrendje is keveredik: a jó válasz mindegyik helyen előfordul
    for (const [k, db] of Object.entries(dont)) for (const d of db) expect(d, k).toBeGreaterThan(0)
  })

  it('a felismerős opciókban nincs képletszám, és egy feladaton belül nincs két egyforma felirat', () => {
    for (const sor of KT.felismero.sorok) expect(lancNevekkel(sor.lanc), sor.lanc).not.toMatch(/\b[1-7]\.[1-5]\b/)
    for (const s of SABLONOK) {
      const f = ujFeladat(s, 1)
      for (const fe of f.felismeresek) {
        const feliratok = fe.opciok.map((id) => lancNevekkel(KT.felismero.sorok.find((x) => x.id === id)!.lanc))
        expect(new Set(feliratok).size, s.id).toBe(feliratok.length)
      }
    }
  })
})
