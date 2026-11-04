// A ZH pontozása a szabályfájl (szabalyok.ts) szerint:
// - igaz-hamis: 3 vagy kevesebb jó → 0; 4 jó → 2; minden további jó +2 (8 jó → 10),
// - feleletválasztós: jó válasz 3 pont (max. 24),
// - számítási példa: jó megoldás 4 pont (max. 16); feltételezés: több kérdezett mennyiségnél mindnek jónak kell lennie.

import { feladatEllenoriz } from '../gyakorlas/ellenorzes.ts'
import type { Tures } from '../gyakorlas/tipusok.ts'
import type { Zh } from './sorsolas.ts'
import { maxPont, SZABALYOK, type ZhSzabalyok } from './szabalyok.ts'

export const MAX = maxPont(SZABALYOK)

function ihPont(jo: number, sz: ZhSzabalyok): number {
  return jo <= sz.igazHamis.kuszob ? 0 : sz.igazHamis.pontPerJo * (jo - sz.igazHamis.kuszob)
}

export function igazHamisPont(jo: number): number {
  return ihPont(jo, SZABALYOK)
}

export function valasztosPont(jo: number): number {
  return SZABALYOK.valasztos.pont * jo
}

export function szamitasPont(jo: number): number {
  return SZABALYOK.szamitas.pont * jo
}

export type Valaszok = {
  ih: (boolean | null)[]
  mc: (number | null)[]
  /** példánként a kérdezett kulcsokhoz beírt szöveg vagy választott opció */
  sz: Record<string, string>[]
}

export function uresValaszok(zh: Zh): Valaszok {
  return { ih: zh.igazHamis.map(() => null), mc: zh.valasztos.map(() => null), sz: zh.szamitas.map(() => ({})) }
}

export type Kiertekeles = {
  ih: boolean[]
  mc: boolean[]
  /** példánként kulcsonként jó-e, és az egész példa jó-e */
  sz: { kulcsok: Record<string, boolean>; jo: boolean; megjegyzes?: string }[]
  pont: { ih: number; mc: number; sz: number; ossz: number }
}

/** A ZH-ban használt tűrés: a lépés saját tűrése, ennek hiányában %-nál a szabályfájl százalékpontja. */
export function zhTures(egyseg: string, sajat: Tures | undefined, sz: ZhSzabalyok = SZABALYOK): Tures | undefined {
  if (sajat || egyseg !== '%') return sajat
  return { abs: sz.tures.szazalekpont / 100 }
}

export function kiertekel(zh: Zh, v: Valaszok, sz: ZhSzabalyok = SZABALYOK): Kiertekeles {
  const ih = zh.igazHamis.map((k, i) => v.ih[i] === k.igaz)
  const mc = zh.valasztos.map((k, i) => v.mc[i] === k.helyes)
  const szam = zh.szamitas.map((p, i) => {
    const kulcsok: Record<string, boolean> = {}
    let megjegyzes: string | undefined
    for (const key of p.kulcsok) {
      const l = p.feladat.lepesek.find((x) => x.key === key)!
      const bevitel = v.sz[i][key] ?? ''
      if (l.tipus === 'szam') {
        const e = feladatEllenoriz(p.feladat, key, bevitel, zhTures(l.egyseg, p.feladat.turesek[key], sz))
        kulcsok[key] = e.ok
        megjegyzes ??= e.nyitott ?? p.feladat.nyitottak[key]?.[0]?.uzenet
      } else kulcsok[key] = bevitel === p.feladat.ertekek[key]
    }
    return { kulcsok, jo: Object.values(kulcsok).every(Boolean), megjegyzes }
  })
  const szPont = sz.szamitas.reszpont
    ? szam.reduce((s, x) => s + (sz.szamitas.pont * Object.values(x.kulcsok).filter(Boolean).length) / Math.max(1, Object.keys(x.kulcsok).length), 0)
    : sz.szamitas.pont * szam.filter((x) => x.jo).length
  const pont = {
    ih: ihPont(ih.filter(Boolean).length, sz),
    mc: sz.valasztos.pont * mc.filter(Boolean).length,
    sz: Math.round(szPont * 100) / 100,
    ossz: 0,
  }
  pont.ossz = pont.ih + pont.mc + pont.sz
  return { ih, mc, sz: szam, pont }
}
