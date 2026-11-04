// Egy ZH összeállítása seedből: 8 igaz-hamis, 8 feleletválasztós, 4 számítási példa.
// Ugyanabból a seedből ugyanaz a ZH.

import { engedettElteres } from '../gyakorlas/ellenorzes.ts'
import { FELISMERO_KERDES, felismeroSzoveg, lancSzoveg } from '../gyakorlas/felismeres.ts'
import { eredmeny, pct, sz } from '../gyakorlas/formaz.ts'
import { type Feladat, felismeroSor, kiertekelo, lancNevekkel, ujFeladat } from '../gyakorlas/motor.ts'
import { SABLONOK, sablonKor } from '../gyakorlas/sablonok/index.ts'
import type { AnySablon, FeladatSzoveg, Getter, SzamLepes } from '../gyakorlas/tipusok.ts'
import { korbaTartozik, type KorValasztas } from '../kor.ts'
import { type Rng, rng } from '../lib/rng.ts'
import { allitasKor, type Allitas, IGAZ_HAMIS_BANK } from './allitasok.ts'
import { ELMELETI, elmeletiKor, type ElmeletiKerdes } from './elmeleti.ts'
import { SZABALYOK } from './szabalyok.ts'

// a darabszámok és az idő a szabályfájlból
export const ZH_PERC = SZABALYOK.perc
export const IH_DB = SZABALYOK.igazHamis.db
export const MC_DB = SZABALYOK.valasztos.db
export const SZ_DB = SZABALYOK.szamitas.db

export type ZhIgazHamis = { allitas: Allitas; igaz: boolean; szoveg: string }

export type ZhValasztos = {
  fajta: 'elmeleti' | 'felismeres' | 'szamitas'
  /** a feladat szövege (felismerős és számítási kérdésnél) */
  szoveg?: FeladatSzoveg
  kerdes: string
  opciok: string[]
  /** felismerős kérdésnél az opciók láncai (a felismerő tábla sorai); a felület képletekkel mutatja őket */
  lancok?: string[]
  helyes: number
  /** kiértékeléskor mutatott indoklás */
  indok?: string
  /** a feladat szövegváltozata („sablon:változat”), ha feladatból készült */
  kulcs?: string
}

export type ZhSzamitas = { feladat: Feladat; szoveg: FeladatSzoveg; kulcsok: string[] }

export type Zh = { seed: number; igazHamis: ZhIgazHamis[]; valasztos: ZhValasztos[]; szamitas: ZhSzamitas[] }

const ZH_KEPES = SABLONOK.filter((s) => s.zh)

function fejezet(id: string): string {
  return id.split('.')[0]
}

/** 8 állítás, lehetőleg minél több különböző fejezetből; mindegyik véletlenül igaz vagy hamis alakban. */
function igazHamisSorsol(r: Rng, bank: readonly Allitas[]): ZhIgazHamis[] {
  const kevert = r.kever(bank)
  const valasztott: Allitas[] = []
  const fejezetek = new Set<string>()
  for (const a of kevert) if (valasztott.length < IH_DB && !fejezetek.has(fejezet(a.forras))) (valasztott.push(a), fejezetek.add(fejezet(a.forras)))
  for (const a of kevert) if (valasztott.length < IH_DB && !valasztott.includes(a)) valasztott.push(a)
  return r.kever(valasztott).map((allitas) => {
    const igaz = r.esely(0.5)
    return { allitas, igaz, szoveg: igaz ? allitas.igaz : allitas.hamis }
  })
}

/** A feladat szövege a kérdések nélkül (a feleletválasztós számításinál egyetlen kérdés jön helyette). */
function kerdesekNelkul(sz: FeladatSzoveg): FeladatSzoveg {
  return { ...sz, kerdesek: [] }
}

/**
 * Négy számszerű opció: a helyes érték és három rossz. A rossz értékek a lépés tipikus hibáinak
 * eredményei (valódi hibás gondolatmenetek). Úgy választunk közülük, hogy a helyes érték nagyság
 * szerinti helye egyenletes legyen (ne mindig középre essen). Tartalék (a helyes érték arányos, a
 * tűrésen jóval túl eső eltolása) csak akkor jön, ha a kívánt oldalon nincs elég tipikus hiba.
 */
export function szamOpciok(l: SzamLepes<unknown>, helyes: number, f: Feladat, r: Rng): { opciok: string[]; helyes: number; tipikus: number } {
  // a kiírt alak felesleges nullák nélkül (0,81 és nem 0,8100)
  const kiir = (v: number) => (l.egyseg === 'tizedes' ? sz(v, 4) : l.egyseg === '%' ? pct(v, 2) : eredmeny(v, l.egyseg))
  const tures = f.turesek[l.key]
  const kuszob = 4 * engedettElteres(helyes, l.egyseg, tures)
  // a nyitott diahiba miatt szintén elfogadott érték nem lehet rossz opció
  const nyitott = (f.nyitottak[l.key] ?? []).map((n) => n.ertek)
  const kulonbozik = (lista: number[], v: number) =>
    Number.isFinite(v) &&
    nyitott.every((n) => Math.abs(n - v) > kuszob) &&
    lista.every((e) => eredmeny(e, l.egyseg) !== eredmeny(v, l.egyseg) && Math.abs(e - v) > Math.max(kuszob, engedettElteres(e, l.egyseg, tures) * 4))
  // a nagyságrendben képtelen érték (pl. 2200%-os hozam, −22-es korreláció) nem hihető opció
  const hiheto = (v: number) =>
    l.egyseg === '%' ? Math.abs(v) <= Math.max(1, 2 * Math.abs(helyes)) : l.egyseg === 'tizedes' ? Math.abs(v - helyes) <= Math.max(3 * Math.abs(helyes), 1) : true

  const jeloltek: number[] = []
  for (const h of f.tipikusHibak[l.key] ?? []) if (hiheto(h.ertek) && kulonbozik([helyes, ...jeloltek], h.ertek)) jeloltek.push(h.ertek)
  const alatta = r.kever(jeloltek.filter((v) => v < helyes))
  const folotte = r.kever(jeloltek.filter((v) => v > helyes))

  // tartalék: arányos eltolás, nulla körüli értéknél egységnyi lépés
  const lepes = l.egyseg === '%' ? 0.02 : l.egyseg === 'tizedes' ? 0.1 : Math.max(1, Math.abs(helyes) * 0.1)
  const tartalek = r.kever([1.25, 0.8, 1.5, 0.65, 1.1, 0.9, 2, 0.5].map((m) => helyes * m)).concat([helyes + lepes, helyes - lepes, helyes + 2 * lepes, helyes - 2 * lepes, helyes + 3 * lepes, helyes - 3 * lepes])
  const opciok = [helyes]
  const tartalekkal = (lent: boolean) => {
    const v = tartalek.find((x) => (lent ? x < helyes : x > helyes) && kulonbozik(opciok, x))
    if (v !== undefined) opciok.push(v)
  }

  // A cél: hány rossz opció legyen a helyes alatt (0–3 egyenletesen), hogy a helyes érték helye ne legyen
  // kitalálható. Ahol az egyik oldalon kevés a tipikus hiba, legfeljebb két tartalék pótolja, a többi hely
  // a másik oldal tipikus hibáié.
  const k = r.egesz(0, 3)
  const lent = Math.min(k, alatta.length)
  const fent = Math.min(3 - k, folotte.length)
  opciok.push(...alatta.slice(0, lent), ...folotte.slice(0, fent))
  for (let i = 0; i < 2 && lent + i < k; i++) tartalekkal(true)
  for (let i = 0; i < 2 && fent + i < 3 - k; i++) tartalekkal(false)
  for (const v of [...alatta.slice(lent), ...folotte.slice(fent)]) if (opciok.length < 4) opciok.push(v)
  for (const v of tartalek) if (opciok.length < 4 && kulonbozik(opciok, v)) opciok.push(v)
  const tipikus = opciok.filter((v) => jeloltek.includes(v)).length
  const kevert = r.kever(opciok)
  return { opciok: kevert.map(kiir), helyes: kevert.indexOf(helyes), tipikus }
}

function elmeletiSorsol(r: Rng, db: number, bank: readonly ElmeletiKerdes[]): ZhValasztos[] {
  return r
    .kever(bank)
    .slice(0, db)
    .map((k) => {
      const opciok = r.kever([k.helyes, ...k.rosszak])
      return { fajta: 'elmeleti' as const, kerdes: k.kerdes, opciok, helyes: opciok.indexOf(k.helyes) }
    })
}

/** A feladat szövegváltozatának kulcsa: „sablon:változat”. */
export function valtozatKulcs(f: Feladat): string {
  return `${f.sablon.id}:${f.szoveg.valtozat ?? ''}`
}

/**
 * Új feladat a sablonból úgy, hogy a szövegváltozata ne legyen a foglaltak között (az előző ZH-é vagy
 * ugyanebben a ZH-ban már szereplő); legfeljebb 30 próbálkozás után elfogadja, ami jön.
 */
function ujFeladatKerulve(s: AnySablon, r: Rng, foglalt: Set<string>): Feladat {
  let f = ujFeladat(s, Math.floor(r.next() * 2 ** 32))
  for (let i = 0; i < 30 && foglalt.has(valtozatKulcs(f)); i++) f = ujFeladat(s, Math.floor(r.next() * 2 ** 32))
  foglalt.add(valtozatKulcs(f))
  return f
}

function felismeresSorsol(r: Rng, sablonok: AnySablon[], foglalt: Set<string>): ZhValasztos[] {
  return sablonok.map((s) => {
    const f = ujFeladatKerulve(s, r, foglalt)
    const fe = f.felismeresek[0]
    const helyesSor = felismeroSor(fe.helyes)
    const lancok = r.kever([fe.helyes, ...fe.zavarok])
    return {
      fajta: 'felismeres' as const,
      kulcs: valtozatKulcs(f),
      // a kérdezett mennyiség nélkül: a kérdés szövege elárulná a láncot
      szoveg: felismeroSzoveg(f.szoveg, fe),
      kerdes: FELISMERO_KERDES,
      opciok: lancok.map(lancSzoveg),
      lancok,
      helyes: lancok.indexOf(fe.helyes),
      indok: `Ha a feladat ezt adja: ${helyesSor.adja}; és ezt kérdezi: ${helyesSor.kerdezi}, akkor a lánc: ${lancNevekkel(helyesSor.lanc)}.`,
    }
  })
}

function szamitasMcSorsol(r: Rng, sablonok: AnySablon[], db: number, foglalt: Set<string>): ZhValasztos[] {
  const ki: ZhValasztos[] = []
  for (const s of sablonok) {
    if (ki.length >= db) break
    const f = ujFeladatKerulve(s, r, foglalt)
    const kulcsok = s.zh!(f.p).kulcsok
    // az utolsó számszerű kérdezett érték
    const l = [...f.lepesek].reverse().find((x) => x.tipus === 'szam' && kulcsok.includes(x.key)) as SzamLepes<unknown> | undefined
    if (!l) continue
    const helyes = f.ertekek[l.key] as number
    const o = szamOpciok(l, helyes, f, r)
    const get = kiertekelo(s, f.p) as Getter
    ki.push({
      fajta: 'szamitas',
      kulcs: valtozatKulcs(f),
      szoveg: kerdesekNelkul(f.szoveg),
      kerdes: l.kerdes,
      opciok: o.opciok,
      helyes: o.helyes,
      indok: [l.levezetes(f.p, get), ...(f.nyitottak[l.key] ?? []).map((n) => n.uzenet)].join(' '),
    })
  }
  return ki
}

function szamitasSorsol(r: Rng, sablonok: AnySablon[], foglalt: Set<string>): ZhSzamitas[] {
  return sablonok.map((s) => {
    const feladat = ujFeladatKerulve(s, r, foglalt)
    const zh = s.zh!(feladat.p)
    return { feladat, kulcsok: zh.kulcsok, szoveg: { ...feladat.szoveg, kerdesek: zh.kerdesek ?? feladat.szoveg.kerdesek } }
  })
}

/**
 * Egy ZH seedből. `kerulendo`: az előző ZH szövegváltozatai (sablon:változat), ezeket lehetőleg nem
 * sorsoljuk újra. `kor`: melyik ZH anyagából (alapból az 1. ZH-éból); „mind” az összes anyagból.
 */
export function zhOsszeallit(seed: number, kerulendo: readonly string[] = [], kor: KorValasztas = 1): Zh {
  const r = rng(seed)
  const foglalt = new Set(kerulendo)
  const ZH_SABLONOK = ZH_KEPES.filter((s) => korbaTartozik(kor, sablonKor(s)))
  const igazHamis = igazHamisSorsol(r, IGAZ_HAMIS_BANK.filter((a) => korbaTartozik(kor, allitasKor(a))))

  // számítási példák: négy különböző családból, családonként egy véletlen ZH-képes sablon
  const csaladok = r.kever([...new Set(ZH_SABLONOK.map((s) => s.csalad))]).slice(0, SZ_DB)
  const szSablonok = csaladok.map((c) => r.valaszt(ZH_SABLONOK.filter((s) => s.csalad === c)))
  // ha kevés a család (a 2. ZH-nál egyelőre kettő), a többi hely a még nem választott sablonoké
  if (szSablonok.length < SZ_DB) szSablonok.push(...r.kever(ZH_SABLONOK.filter((s) => !szSablonok.includes(s))).slice(0, SZ_DB - szSablonok.length))
  const szamitas = szamitasSorsol(r, szSablonok, foglalt)

  // feleletválasztós: 2–4 elméleti, 1–2 felismerős, a többi számítási
  const elmDb = r.egesz(2, 4)
  const felDb = r.egesz(1, 2)
  const szamDb = MC_DB - elmDb - felDb
  const maradek = r.kever(ZH_SABLONOK.filter((s) => !szSablonok.includes(s)))
  const mcSzamSablonok = [...maradek, ...r.kever(ZH_SABLONOK)].filter((s, i, t) => t.indexOf(s) === i)
  const mcSzam = szamitasMcSorsol(r, mcSzamSablonok, szamDb, foglalt)
  const felSablonok = r.kever(ZH_SABLONOK.filter((s) => s.felismeresek.length > 0)).slice(0, felDb)
  const valasztos = r.kever([...elmeletiSorsol(r, elmDb, ELMELETI.filter((k) => korbaTartozik(kor, elmeletiKor(k)))), ...felismeresSorsol(r, felSablonok, foglalt), ...mcSzam])

  return { seed, igazHamis, valasztos, szamitas }
}

/** A ZH-ban szereplő szövegváltozatok (a következő ZH ezeket kerüli). */
export function valtozatKulcsok(zh: Zh): string[] {
  return [...zh.szamitas.map((p) => valtozatKulcs(p.feladat)), ...zh.valasztos.flatMap((k) => (k.kulcs ? [k.kulcs] : []))]
}
