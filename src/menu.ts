import { link, type Utvonal } from './router.ts'

// A főmenü négy iránya. A térkép, a felismerő tábla és a „Hibák a diákon” a Képletek alá tartozik
// (ott almenüben érhetők el); a felismerést magát minden gyakorló feladat első lépése gyakoroltatja.

export type MenuPont = { cim: string; rovid?: string; href: string; aktiv: (u: Utvonal) => boolean }

const KEPLET_OLDALAK = new Set<Utvonal['oldal']>(['kepletek', 'keplet', 'terkep', 'felismero', 'hibak'])

export const MENU: MenuPont[] = [
  { cim: 'Leckék', href: link.leckek, aktiv: (u) => u.oldal === 'leckek' || u.oldal === 'lecke' || u.oldal === 'leckeMinta' },
  { cim: 'Képletek', href: link.kepletek, aktiv: (u) => KEPLET_OLDALAK.has(u.oldal) },
  {
    cim: 'Gyakorlás',
    href: link.gyakorlas,
    aktiv: (u) => u.oldal === 'gyakorlas' || u.oldal === 'gyakorlo' || u.oldal === 'zh' || u.oldal === 'statisztika',
  },
  { cim: 'ZH-szimuláció', rovid: 'ZH', href: link.zhSzimulacio, aktiv: (u) => u.oldal === 'zhSzimulacio' },
]

/** A Képletek almenüje. */
export const KEPLET_ALMENU: { cim: string; href: string; oldal: Utvonal['oldal'] }[] = [
  { cim: 'Képletlista', href: link.kepletek, oldal: 'kepletek' },
  { cim: 'Térkép', href: link.terkep, oldal: 'terkep' },
  { cim: 'Felismerő tábla', href: link.felismero, oldal: 'felismero' },
  { cim: 'Hibák a diákon', href: link.hibak, oldal: 'hibak' },
]

export function kepletOldal(u: Utvonal): boolean {
  return KEPLET_OLDALAK.has(u.oldal)
}
