import type { Rng } from '../lib/rng.ts'

// A gyakorló feladatsablonok típusai.

export type TipikusHiba = { ertek: number; uzenet: string }

export type Egyseg = '%' | 'tizedes' | 'USD' | 'M USD'
export type Tures = { abs?: number; rel?: number }

/** Egy korábbi lépés eredménye kulcs szerint (lustán kiszámolva). */
export type Getter = (key: string) => number

type LepesAlap<P> = {
  key: string
  formulaId: string
  /** a képlet hányadik LaTeX-blokkját mutassa a tipp (alapból 0) */
  latexIdx?: number
  kerdes: string
  mikor?: (p: P) => boolean
  levezetes: (p: P, e: Getter) => string
}

export type SzamLepes<P> = LepesAlap<P> & {
  tipus: 'szam'
  egyseg: Egyseg
  /** fix tűrés, vagy a feladattól függő (pl. az NPV-nél a pénzáramlások nagyságához mérten) */
  tures?: Tures | ((p: P, e: Getter) => Tures)
  /** ismert hibás utak eredménye, célzott visszajelzéssel (pl. N-nel osztás N − 1 helyett) */
  tipikusHibak?: (p: P, e: Getter) => TipikusHiba[]
  /** nyitott diahiba miatt szintén elfogadott értékek (a „Hibák a diákon” nyitott tételei), üzenettel */
  nyitott?: (p: P, e: Getter) => { ertek: number; uzenet: string }[]
  ertek: (p: P, e: Getter) => number
}

export type ValasztoLepes<P> = LepesAlap<P> & {
  tipus: 'valasztas'
  opciok: string[]
  /** ismert hibás gondolatmenet eredménye (pl. a WACC-hoz hasonlítás), célzott üzenettel */
  tipikusValaszok?: (p: P, e: Getter) => { valasz: string; uzenet: string }[]
  ertek: (p: P, e: Getter) => string
}

export type Lepes<P> = SzamLepes<P> | ValasztoLepes<P>

/** Felismerési kérdés: a felismerő tábla sorai közül kell választani (F01…F14). */
export type Felismeres = {
  /** a lépés kulcsa, amely előtt ez a felismerés jön ('' = a feladat elején) */
  elott: string
  helyes: string
  zavarok: string[]
  /** hány kérdés látszik már a felismerés alatt (a feladat közbeni felismerésnél a megválaszoltak); alapból 0 */
  lathatoKerdes?: number
}

export type FeladatSzoveg = {
  /** a szövegváltozat (keret) azonosítója, pl. „k2”: szereplő, mondatsorrend, zavaró adat */
  valtozat?: string
  bekezdesek: string[]
  tabla?: { fejlec: string[]; sorok: string[][] }
  kerdesek: string[]
}

export type Csalad = 'hozam' | 'allapot' | 'beta' | 'capm' | 'npv' | 'wacc' | 'mm' | 'ado'

export type Sablon<P> = {
  id: string
  csalad: Csalad
  cim: string
  felismeresek: Felismeres[]
  general: (r: Rng) => P
  ervenyes: (p: P) => boolean
  szoveg: (p: P, r: Rng) => FeladatSzoveg
  lepesek: Lepes<P>[]
  /**
   * ZH-szimulációhoz: mely lépések a feladat kérdezett végeredményei (csak ezek kapnak beviteli mezőt),
   * és ha a ZH-ban más kérdés kell (pl. az évenkénti hozamok nélkül), annak a szövege. Ha nincs
   * megadva, a sablon a ZH-ba nem kerül.
   */
  zh?: (p: P) => { kulcsok: string[]; kerdesek?: string[] }
  /**
   * Haladó (kézzel, kb. 75 másodperc alatt nem számolható) változat, pl. iterációs YTM. Ilyet csak a
   * gyakorlás „haladó” kapcsolójával sorsolunk; a ZH-ban soha.
   */
  halado?: (p: P) => boolean
  /** a diás példák a dián szereplő alakban (pl. "13,18%"); csak a vart kulcsok számolódnak ki, ezért a paraméterek lehetnek hiányosak */
  diasPeldak: { forras: string; p: Partial<P>; vart: Record<string, string> }[]
}

export type AnySablon = Sablon<any>

export type { Rng } from '../lib/rng.ts'
