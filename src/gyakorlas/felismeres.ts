// A felismerő kérdés (melyik képletlánc kell?) úgy, hogy a kérdés formája ne árulja el a választ:
// - a feladat szövege a kérdezett mennyiség előtt véget ér (a kérdések rejtve maradnak),
// - a kérdés mindig ugyanaz,
// - az opciók a lánc képletei (nem a képletek neve, amely szó szerint a kérdésből jönne: NPV, WACC…).

import { keplet } from '../content/kepletter.ts'
import { KEPLET_ID_MINTA } from '../content/parse.ts'
import { felismeroSor } from './motor.ts'
import type { FeladatSzoveg, Felismeres } from './tipusok.ts'

export const FELISMERO_KERDES = 'Melyik képletlánc kell ehhez a feladathoz?'

/** A felismerés alatt látható szöveg: az adatok, a kérdések nélkül (vagy csak a már megválaszolt kérdésekkel). */
export function felismeroSzoveg(sz: FeladatSzoveg, fe: Pick<Felismeres, 'lathatoKerdes'>): FeladatSzoveg {
  return { ...sz, kerdesek: sz.kerdesek.slice(0, fe.lathatoKerdes ?? 0) }
}

/**
 * Ahol a lánc szövege olyan szót tartalmaz, amely a feladatok szövegében adatként szerepel, az opcióban
 * csak a képletek látszanak. F13: a „piaci értékek” lépés a 7.4 képletében (E/V, D/V) benne van, a „piaci”
 * szó viszont a WACC-feladatok adataiban is áll (piaci kockázati prémium). F14: a „nem a WACC” a megadott
 * WACC-ú feladatok szövegében is szerepel; a 7.5-nek nincs képlete.
 */
const MEGJELENITES: Record<string, string> = {
  F13: '5.1 / 7.2 → 7.3 → 7.4',
  F14: '5.1 projektenként',
}

export type LancResz = { tipus: 'keplet'; id: string; latex: string } | { tipus: 'szoveg'; szoveg: string }

/** A felismerő tábla egy sorának lánca képletekkel: a képletszám helyén a képlet első LaTeX-blokkja. */
export function lancReszek(sorId: string): LancResz[] {
  let lanc = MEGJELENITES[sorId] ?? felismeroSor(sorId).lanc
  // képlet nélküli hivatkozás (pl. 7.5): zárójelestül elhagyjuk
  lanc = lanc.replace(/\s*\((\d{1,2}\.\d{1,2})\)/g, (m, id: string) => (keplet(id)?.latex.length ? m : ''))
  const reszek: LancResz[] = []
  for (const d of lanc.replace(/\\_/g, '_').split(new RegExp(KEPLET_ID_MINTA.source))) {
    if (/^\d{1,2}\.\d{1,2}$/.test(d)) {
      const latex = keplet(d)?.latex[0]
      if (latex) reszek.push({ tipus: 'keplet', id: d, latex })
    } else if (d.trim()) reszek.push({ tipus: 'szoveg', szoveg: d.trim() })
  }
  return reszek
}

/** A lánc egyszerű szöveges alakja (a ZH-ban az opciók összehasonlításához; képletszám nincs benne). */
export function lancSzoveg(sorId: string): string {
  return lancReszek(sorId)
    .map((r) => (r.tipus === 'keplet' ? `$${r.latex}$` : r.szoveg))
    .join(' ')
}
