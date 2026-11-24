import { describe, expect, it } from 'vitest'
import { KEPLET_ID_MINTA } from '../../content/parse.ts'
import { engedettElteres } from '../../gyakorlas/ellenorzes.ts'
import { ujFeladat } from '../../gyakorlas/motor.ts'
import { SABLONOK } from '../../gyakorlas/sablonok/index.ts'
import type { SzamLepes } from '../../gyakorlas/tipusok.ts'
import { ALLITASOK } from '../allitasok.ts'
import { ELMELETI } from '../elmeleti.ts'
import { forrasIdezet, igazHamisMagyarazat, lancMagyarazat, reszErtek, reszeredmenyek, sajatHiba, szoCsere } from '../magyarazat.ts'
import { MC_HATTER, zhOsszeallit } from '../sorsolas.ts'

// A ZH kiértékelése: minden feladat alatt a részeredmények és a „miért ez a helyes” magyarázat.

describe('igaz-hamis magyarázat', () => {
  it('a szócsere pontosan a megváltozott szavakat adja', () => {
    expect(szoCsere('A számtani átlaghozam azt mutatja.', 'A mértani átlaghozam azt mutatja.')).toEqual([{ igaz: 'számtani', hamis: 'mértani' }])
  })

  it('minden hamis alakhoz van legalább egy csere, és a csere a két mondatból jön', () => {
    for (const a of ALLITASOK) {
      const m = igazHamisMagyarazat({ allitas: a, igaz: false, szoveg: a.hamis })
      expect(m.cserek.length, a.id).toBeGreaterThanOrEqual(1)
      for (const c of m.cserek) {
        if (c.hamis) expect(a.hamis, a.id).toContain(c.hamis)
        if (c.igaz) expect(a.igaz, a.id).toContain(c.igaz)
      }
      expect(m.helyes).toBe(a.igaz)
    }
  })

  it('a két mondat szavanként jelölve: összerakva az eredeti mondat, a hamisban legalább egy szó változott', () => {
    for (const a of ALLITASOK) {
      const m = igazHamisMagyarazat({ allitas: a, igaz: false, szoveg: a.hamis })
      expect(m.jelolt.igaz.map((x) => x.szoveg).join(' '), a.id).toBe(a.igaz)
      expect(m.jelolt.hamis.map((x) => x.szoveg).join(' '), a.id).toBe(a.hamis)
      expect(m.jelolt.hamis.some((x) => x.valtozott) || m.jelolt.igaz.some((x) => x.valtozott), a.id).toBe(true)
    }
    const m = igazHamisMagyarazat({ allitas: ALLITASOK.find((x) => x.id === 'teljes-hozam')!, igaz: false, szoveg: '' })
    expect(m.jelolt.hamis.filter((x) => x.valtozott).map((x) => x.szoveg)).toEqual(['záró'])
    expect(m.jelolt.igaz.filter((x) => x.valtozott).map((x) => x.szoveg)).toEqual(['kezdő'])
  })

  it('igaz alaknál nincs csere', () => {
    const a = ALLITASOK[0]
    expect(igazHamisMagyarazat({ allitas: a, igaz: true, szoveg: a.igaz }).cserek).toEqual([])
  })
})

describe('forrásidézet a képlettárból', () => {
  it('minden állításhoz és elméleti kérdéshez van idézet, név képletszám nélkül, a kulcs benne', () => {
    for (const k of [...ALLITASOK, ...ELMELETI]) {
      const f = forrasIdezet(k.forras, k.kulcs)
      expect(f, k.id).toBeDefined()
      expect(f!.nev.trim(), k.id).not.toBe('')
      expect(f!.nev, k.id).not.toMatch(KEPLET_ID_MINTA)
      expect(f!.idezet.length, k.id).toBeLessThan(700)
      if (!k.kulcs.startsWith('|')) expect(f!.idezet, k.id).toContain(k.kulcs)
    }
  })

  it('táblázatsornál a fejléc nevei is ott vannak (a „piac megfizeti” kérdés)', () => {
    const k = ELMELETI.find((x) => x.id === 'piac-megfizeti')!
    const f = forrasIdezet(k.forras, k.kulcs)!
    expect(f.idezet).toContain('Megfizeti a piac? igen')
    expect(f.idezet).toContain('Tag: β²σ²(rM)')
    expect(f.idezet).not.toContain('|')
  })

  it('képletblokkból vett kulcsnál az idézet a képlet, LaTeX-ként jelölve', () => {
    const k = ELMELETI.find((x) => x.kulcs === 'TS_{\\text{éves}} = T_C \\cdot D \\cdot r_D')!
    const f = forrasIdezet(k.forras, k.kulcs)!
    expect(f.latex).toBe(true)
    expect(forrasIdezet('1.1', 'a záró árfolyam plusz az osztalék, osztva a kezdő árfolyammal, mínusz egy')!.latex).toBeFalsy()
  })

  it('zárójelben és rövidítés után nem vág mondatot (szem. Baumol 1b)', () => {
    const f = forrasIdezet('9.1', 'nagyobb pénzigény (T) → nagyobb C\\_opt')!
    expect(f.idezet).toContain('(szem. Baumol 1b, a képletből)')
  })

  it('ha a mondat nem a sor elején áll, a pont címkéje elé kerül', () => {
    const f = forrasIdezet('9', 'Mérése likviditási mutatókkal')!
    expect(f.idezet).toMatch(/^\*\*[^*]+:\*\* … Mérése likviditási mutatókkal/)
  })

  it('az idézet egész mondat: nem a mondat közepén kezdődik', () => {
    const a = ALLITASOK.find((x) => x.id === 'teljes-hozam')!
    const f = forrasIdezet(a.forras, a.kulcs)!
    expect(f.idezet.length).toBeGreaterThan(a.kulcs.length)
  })
})

const ZH_SABLONOK = SABLONOK.filter((s) => s.zh)

describe('részeredmények', () => {
  // a felhasználó kérése (2026-11-24): csak a kérdezett értékek és a hozzájuk vezető lépések; a lépések a
  // megoldás sorrendjében állnak, ezért az utolsó kérdezett lépés utániak kimaradnak
  it('minden ZH-képes sablonnál a lépések az utolsó kérdezettig megjelennek, a kérdezettek jelölve, az érték a helyes érték', () => {
    for (const s of ZH_SABLONOK)
      for (let seed = 1; seed <= 20; seed++) {
        const f = ujFeladat(s, seed)
        const kulcsok = s.zh!(f.p).kulcsok
        const r = reszeredmenyek(f, kulcsok)
        const utolso = Math.max(...f.lepesek.map((l, i) => (kulcsok.includes(l.key) ? i : -1)))
        expect(r.map((x) => x.key), s.id).toEqual(f.lepesek.slice(0, utolso + 1).map((l) => l.key))
        expect(r[r.length - 1].kerdezett, s.id).toBe(true)
        for (const x of r) {
          const l = f.lepesek.find((y) => y.key === x.key)!
          expect(x.ertek, `${s.id} ${x.key}`).toBe(l.tipus === 'szam' ? reszErtek(f.ertekek[x.key] as number, l.egyseg) : String(f.ertekek[x.key]))
          expect(x.levezetes.trim(), `${s.id} ${x.key}`).not.toBe('')
          expect(x.kerdezett).toBe(kulcsok.includes(x.key))
        }
      }
  })

  it('a kérdezett utáni lépések kimaradnak (Baumol: C kérdésnél nincs L és Lnap)', () => {
    const s = SABLONOK.find((x) => x.id === 'baumol')!
    for (let seed = 1; seed <= 60; seed++) {
      const f = ujFeladat(s, seed)
      if (!f.lepesek.some((l) => l.key === 'Lnap')) continue
      const keys = reszeredmenyek(f, ['C']).map((x) => x.key)
      expect(keys).toContain('C')
      expect(keys).not.toContain('L')
      expect(keys).not.toContain('Lnap')
      return
    }
    throw new Error('nincs Baumol-feladat L lépéssel')
  })

  it('a felismerés magyarázata a felismerő tábla sorából jön, képletszám nélkül', () => {
    for (const s of ZH_SABLONOK.filter((x) => x.felismeresek.length)) {
      const m = lancMagyarazat(ujFeladat(s, 3))!
      expect(m.adja.trim(), s.id).not.toBe('')
      expect(m.kerdezi.trim(), s.id).not.toBe('')
      expect(m.lanc, s.id).not.toMatch(/\b\d+\.\d+\b/)
    }
  })
})

describe('a beírt rossz érték tipikus hibája', () => {
  it('ha a beírt érték egy tipikus hiba eredménye, annak az üzenetét adja; a helyes értékre semmit', () => {
    let db = 0
    for (const s of ZH_SABLONOK)
      for (let seed = 1; seed <= 10; seed++) {
        const f = ujFeladat(s, seed)
        for (const l of f.lepesek) {
          if (l.tipus !== 'szam') continue
          const h = f.tipikusHibak[l.key]?.[0]
          // ha a tipikus hiba értéke a tűrésen belül egybeesik a helyessel, a válasz jó: nincs mit jelezni
          if (!h || !Number.isFinite(h.ertek) || Math.abs(h.ertek - (f.ertekek[l.key] as number)) <= engedettElteres(f.ertekek[l.key] as number, l.egyseg, f.turesek[l.key])) continue
          const v = l.egyseg === '%' ? h.ertek * 100 : h.ertek
          const uzenet = sajatHiba(f, l.key, String(v).replace('.', ','))
          // ha két tipikus hiba ugyanazt az értéket adja, az elsőé az üzenet
          expect(uzenet, `${s.id} ${l.key}`).toBe(f.tipikusHibak[l.key].find((x) => Math.abs(x.ertek - h.ertek) < 1e-9)!.uzenet)
          const jo = f.ertekek[l.key] as number
          expect(sajatHiba(f, l.key, String((l as SzamLepes<unknown>).egyseg === '%' ? jo * 100 : jo).replace('.', ',')), `${s.id} ${l.key}`).toBeUndefined()
          db++
        }
      }
    expect(db).toBeGreaterThan(50)
  })
})

describe('a választós lépés tipikus rossz válasza', () => {
  it('a tipikus rossz választás üzenetét adja, a helyesre semmit', () => {
    let db = 0
    for (const s of ZH_SABLONOK)
      for (let seed = 1; seed <= 10; seed++) {
        const f = ujFeladat(s, seed)
        for (const l of f.lepesek) {
          const t = f.tipikusValaszok[l.key]?.[0]
          if (l.tipus !== 'valasztas' || !t || t.valasz === f.ertekek[l.key]) continue
          expect(sajatHiba(f, l.key, t.valasz), `${s.id} ${l.key}`).toBe(t.uzenet)
          expect(sajatHiba(f, l.key, String(f.ertekek[l.key]))).toBeUndefined()
          db++
        }
      }
    expect(db).toBeGreaterThan(0)
  })
})

describe('a ZH feleletválasztós kérdéseinek háttere (a ZH adatát nem változtatja)', () => {
  it('minden kérdéshez van háttér; a számítási kérdésnél opciónként a tipikus hiba üzenete, a helyesnél semmi', () => {
    for (const kor of [1, 2] as const)
      for (let seed = 1; seed <= 30; seed++) {
        const zh = zhOsszeallit(seed, [], kor)
        for (const k of zh.valasztos) {
          const h = MC_HATTER.get(k)
          expect(h, `${kor}/${seed} ${k.fajta}`).toBeDefined()
          expect(h!.fajta).toBe(k.fajta)
          if (h!.fajta === 'szamitas') {
            expect(h!.uzenetek).toHaveLength(k.opciok.length)
            expect(h!.uzenetek[k.helyes]).toBeNull()
            expect(h!.feladat.lepesek.some((l) => l.key === h!.key)).toBe(true)
          }
          if (h!.fajta === 'elmeleti') expect(h!.kerdes.helyes).toBe(k.opciok[k.helyes])
        }
      }
  })

  it('a tipikus hibából jövő opcióknál van üzenet (legalább annyi, ahány tipikus opció)', () => {
    let uzenetes = 0
    let rossz = 0
    for (let seed = 1; seed <= 40; seed++)
      for (const k of zhOsszeallit(seed, [], 2).valasztos) {
        const h = MC_HATTER.get(k)
        if (h?.fajta !== 'szamitas') continue
        uzenetes += h.uzenetek.filter((u) => u).length
        rossz += k.opciok.length - 1
      }
    expect(uzenetes / rossz).toBeGreaterThan(0.6)
  })
})
