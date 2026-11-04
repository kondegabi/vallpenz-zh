import { link } from '../router.ts'
import type { ZhEredmeny } from '../zh/eredmenyek.ts'

// A kezdőoldal három iránya.

export type Irany = { cim: string; alcim: string; leiras: string; linkek: { cim: string; href: string; fo?: boolean }[] }

export const IRANYOK: Irany[] = [
  {
    cim: 'Tanulok',
    alcim: 'Leckék és képletek',
    leiras: 'Interaktív leckék a diák ábráival, és a képlettár: minden képlet a jeleivel, magyarázattal, a diák példáival és a tipikus csapdákkal.',
    linkek: [
      { cim: 'Leckék', href: link.leckek, fo: true },
      { cim: 'Képletek', href: link.kepletek },
    ],
  },
  {
    cim: 'Gyakorlok',
    alcim: 'Felismerés és lépésenkénti számolás',
    leiras: 'Szöveges feladatok: előbb felismered, melyik képletlánc kell, utána lépésenként számolsz, azonnali visszajelzéssel. Egy feladattípus, egy témakör, vagy vegyesen, akár időre.',
    linkek: [{ cim: 'Gyakorlás', href: link.gyakorlas, fo: true }],
  },
  {
    cim: 'Felmérem magam',
    alcim: 'ZH-szimuláció',
    leiras: 'A valódi ZH formátuma: 25 perc, 8 igaz-hamis, 8 feleletválasztós és 4 számítási példa, 50 pont. Visszajelzés csak a beadás után, a végén tempóelemzéssel.',
    linkek: [{ cim: 'ZH-szimuláció', href: link.zhSzimulacio, fo: true }],
  },
]

export function legutobbiZh(eredmenyek: ZhEredmeny[]): ZhEredmeny | undefined {
  return eredmenyek[eredmenyek.length - 1]
}
