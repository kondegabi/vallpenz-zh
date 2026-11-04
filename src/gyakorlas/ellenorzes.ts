import { beolvas } from '../lib/szam.ts'
import type { Egyseg, TipikusHiba, Tures } from './tipusok.ts'

const ALAP_TURES: Record<Egyseg, Tures> = {
  '%': { abs: 0.0005 }, // 0,05 százalékpont
  tizedes: { abs: 0.005 },
  USD: { abs: 0.01, rel: 0.001 },
  'M USD': { abs: 0.005, rel: 0.001 },
}

/** Az elfogadott eltérés egy helyes értéktől (a lépés tűrésével, ennek hiányában az egység alaptűrésével). */
export function engedettElteres(helyes: number, egyseg: Egyseg, tures?: Tures): number {
  const t = { ...ALAP_TURES[egyseg], ...tures }
  return Math.max(t.abs ?? 0, (t.rel ?? 0) * Math.abs(helyes)) + 1e-12
}

export type Ellenorzes = { ok: true; ertek: number } | { ok: false; ertek?: number; uzenet?: string }

/**
 * A beírt érték összevetése a helyessel. %-os lépésnél a szám százalékban értendő („13,18” = 13,18%);
 * ha valaki tizedes lépésnél %-jelet ír, azt is százalékként olvassuk.
 */
export function ellenoriz(bevitel: string, helyes: number, egyseg: Egyseg, tures?: Tures): Ellenorzes {
  const b = beolvas(bevitel)
  if (!b) return { ok: false, uzenet: 'Számot írj be, például 13,18' }
  const ertek = egyseg === '%' || b.szazalek ? b.ertek / 100 : b.ertek
  const t = { ...ALAP_TURES[egyseg], ...tures }
  const engedett = Math.max(t.abs ?? 0, (t.rel ?? 0) * Math.abs(helyes)) + 1e-12
  return Math.abs(ertek - helyes) <= engedett ? { ok: true, ertek } : { ok: false, ertek }
}

/** Ha a hibás érték egy ismert hibás út eredménye (a lépés tűrésével), annak az üzenete. */
export function tipikusHiba(ertek: number, hibak: TipikusHiba[], egyseg: Egyseg, tures?: Tures): string | undefined {
  const t = { ...ALAP_TURES[egyseg], ...tures }
  return hibak.find((h) => Math.abs(ertek - h.ertek) <= Math.max(t.abs ?? 0, (t.rel ?? 0) * Math.abs(h.ertek)) + 1e-12)?.uzenet
}

/** Egy feladatlépés ellenőrzése: a helyes értéken túl a nyitott diahiba miatt szintén elfogadott értékekkel. */
export function feladatEllenoriz(
  f: { lepesek: { key: string; tipus: string; egyseg?: Egyseg }[]; ertekek: Record<string, number | string>; turesek: Record<string, Tures | undefined>; nyitottak: Record<string, NyitottErtek[]> },
  key: string,
  bevitel: string,
  tures: Tures | undefined = f.turesek[key],
): Ellenorzes & { nyitott?: string } {
  const l = f.lepesek.find((x) => x.key === key)
  if (!l || l.tipus !== 'szam' || !l.egyseg) throw new Error(`Nem számszerű lépés: ${key}`)
  const e = ellenoriz(bevitel, f.ertekek[key] as number, l.egyseg, tures)
  const nyitottak = f.nyitottak[key] ?? []
  if (!nyitottak.length) return e
  if (e.ok) return { ...e, nyitott: nyitottak[0].uzenet }
  const talalt = e.ertek === undefined ? undefined : nyitottak.find((n) => Math.abs(e.ertek! - n.ertek) <= engedettElteres(n.ertek, l.egyseg!, tures))
  return talalt ? { ok: true, ertek: e.ertek!, nyitott: talalt.uzenet } : e
}

export type NyitottErtek = { ertek: number; uzenet: string }
