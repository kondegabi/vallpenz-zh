import { KEPLETEK, KT } from '../content/kepletter.ts'
import { KEPLET_ID_MINTA } from '../content/parse.ts'
import { rng } from '../lib/rng.ts'
import type { AnySablon, FeladatSzoveg, Felismeres, Getter, Lepes, TipikusHiba, Tures } from './tipusok.ts'

export type Feladat = {
  sablon: AnySablon
  seed: number
  p: any
  szoveg: FeladatSzoveg
  lepesek: Lepes<unknown>[]
  ertekek: Record<string, number | string>
  turesek: Record<string, Tures | undefined>
  tipikusHibak: Record<string, TipikusHiba[]>
  tipikusValaszok: Record<string, { valasz: string; uzenet: string }[]>
  /** nyitott diahiba miatt szintén elfogadott értékek lépésenként */
  nyitottak: Record<string, { ertek: number; uzenet: string }[]>
  felismeresek: (Felismeres & { opciok: string[] })[]
}

export function aktivLepesek<P>(s: { lepesek: Lepes<P>[] }, p: P): Lepes<P>[] {
  return s.lepesek.filter((l) => !l.mikor || l.mikor(p))
}

/** A lépés tűrése a konkrét feladatra kiszámolva. */
export function lepesTures<P>(l: Lepes<P>, p: P, e: Getter): Tures | undefined {
  if (l.tipus !== 'szam') return undefined
  return typeof l.tures === 'function' ? l.tures(p, e) : l.tures
}

/** Lusta kiértékelő: egy kulcs értéke a hozzá tartozó (aktív) lépésből, a függőségeivel együtt. */
export function kiertekelo<P>(s: { lepesek: Lepes<P>[] }, p: P): (key: string) => number | string {
  const aktiv = aktivLepesek(s, p)
  const cache = new Map<string, number | string>()
  const get = (key: string): number | string => {
    if (cache.has(key)) return cache.get(key)!
    const l = aktiv.find((x) => x.key === key)
    if (!l) throw new Error(`Nincs aktív lépés ehhez: ${key}`)
    const v = l.ertek(p, get as Getter)
    cache.set(key, v)
    return v
  }
  return get
}

/**
 * A lánc a gyakorláshoz képletszámok nélkül: minden képletszám helyén a képlet neve áll
 * (pl. „5.1 átrendezve” → „A CAPM-egyenlet átrendezve”).
 */
export function lancNevekkel(lanc: string): string {
  return lanc.replace(KEPLET_ID_MINTA, (m) => KEPLETEK.find((k) => k.id === m)?.cim ?? m)
}

export function felismeroSor(id: string) {
  const s = KT.felismero.sorok.find((x) => x.id === id)
  if (!s) throw new Error(`Nincs ilyen felismerő sor: ${id}`)
  return s
}

export type TervElem = { tipus: 'felismeres'; i: number } | { tipus: 'lepes'; i: number }

/** A feladat menete: felismerések a megadott lépések előtt, köztük a számolási lépések. */
export function tervKeszit(f: Pick<Feladat, 'lepesek' | 'felismeresek'>): TervElem[] {
  const terv: TervElem[] = []
  f.lepesek.forEach((l, i) => {
    f.felismeresek.forEach((fe, j) => {
      if ((fe.elott === '' && i === 0) || fe.elott === l.key) terv.push({ tipus: 'felismeres', i: j })
    })
    terv.push({ tipus: 'lepes', i })
  })
  return terv
}

/** Egy felismerési szakaszhoz tartozó képletek: a lépései a következő felismerésig. */
export function szakaszKepletei(f: Pick<Feladat, 'lepesek'>, terv: TervElem[], poz: number): string[] {
  const ids: string[] = []
  for (let i = poz + 1; i < terv.length && terv[i].tipus === 'lepes'; i++) ids.push(f.lepesek[terv[i].i].formulaId)
  return [...new Set(ids)]
}

export type FeladatBeallitas = {
  /** haladó változatok is (pl. iterációs YTM); alapból nem */
  halado?: boolean
}

/** Feladat egy seedből: érvényes paraméterek, szöveg, lépések, helyes értékek, kevert opciók. */
export function ujFeladat(sablon: AnySablon, seed: number, beall: FeladatBeallitas = {}): Feladat {
  const r = rng(seed)
  const jo = (p: unknown) => sablon.ervenyes(p) && (beall.halado || !sablon.halado?.(p))
  let p = sablon.general(r)
  for (let i = 0; i < 500 && !jo(p); i++) p = sablon.general(r)
  if (!jo(p)) throw new Error(`Nem sikerült érvényes paramétert generálni: ${sablon.id}`)
  // a válaszlehetőségek sorrendje külön, a feladat tartalmától független véletlenből jön
  const rk = rng((seed ^ 0x9e3779b9) >>> 0)
  const lepesek = (aktivLepesek(sablon, p) as Lepes<unknown>[]).map((l) => (l.tipus === 'valasztas' ? { ...l, opciok: rk.kever(l.opciok) } : l))
  const get = kiertekelo(sablon, p)
  const ertekek = Object.fromEntries(lepesek.map((l) => [l.key, get(l.key)]))
  const turesek = Object.fromEntries(lepesek.map((l) => [l.key, lepesTures(l, p, get as Getter)]))
  const tipikusHibak = Object.fromEntries(
    lepesek.map((l) => [l.key, l.tipus === 'szam' && l.tipikusHibak ? l.tipikusHibak(p, get as Getter) : []]),
  )
  const tipikusValaszok = Object.fromEntries(
    lepesek.map((l) => [l.key, l.tipus === 'valasztas' && l.tipikusValaszok ? l.tipikusValaszok(p, get as Getter) : []]),
  )
  const nyitottak = Object.fromEntries(lepesek.map((l) => [l.key, l.tipus === 'szam' && l.nyitott ? l.nyitott(p, get as Getter) : []]))
  return {
    sablon,
    seed,
    p,
    szoveg: sablon.szoveg(p, r),
    lepesek,
    ertekek,
    turesek,
    tipikusHibak,
    tipikusValaszok,
    nyitottak,
    felismeresek: sablon.felismeresek.map((f) => ({ ...f, opciok: rk.kever([f.helyes, ...f.zavarok]) })),
  }
}
