import { kepletKor } from '../content/kepletter.ts'
import type { Kor } from '../kor.ts'

// A leckék listája (a navigátorhoz). `kesz`: elkészült-e már.

export type LeckeInfo = { szam: number; cim: string; kepletek: string[]; kesz: boolean }

export const LECKEK: LeckeInfo[] = [
  { szam: 1, cim: 'Számtani, mértani és folytonos átlag', kepletek: ['1.2', '1.3', '1.4'], kesz: true },
  { szam: 2, cim: 'Normális eloszlás és szigma-szabályok', kepletek: ['2.4'], kesz: true },
  { szam: 3, cim: 'Várható hozam és szórás állapotokból', kepletek: ['2.1', '2.2'], kesz: true },
  { szam: 4, cim: 'Kételemű portfólió', kepletek: ['3.1', '3.4'], kesz: true },
  { szam: 5, cim: 'Diverzifikáció', kepletek: ['3.5', '4.3'], kesz: true },
  { szam: 6, cim: 'Tőkeallokációs és tőkepiaci egyenes', kepletek: ['3.5', '5.4'], kesz: true },
  { szam: 7, cim: 'Karakterisztikus egyenes és kockázatfelbontás', kepletek: ['4.1', '4.2', '4.3'], kesz: true },
  { szam: 8, cim: 'SML és árazottság', kepletek: ['5.1', '5.2', '5.3'], kesz: true },
  { szam: 9, cim: 'Osztalékmodell érzékenysége', kepletek: ['7.1'], kesz: true },
  { szam: 10, cim: 'NPV-profil és IRR', kepletek: ['6.1', '6.2'], kesz: true },
  { szam: 11, cim: 'WACC összetétele', kepletek: ['7.3', '7.4'], kesz: true },
  { szam: 12, cim: 'WACC vagy projekt-CAPM', kepletek: ['7.5'], kesz: true },
  { szam: 13, cim: 'MM-tételek: tőkeköltség és tőkeáttétel', kepletek: ['8.1', '8.3', '8.7', '8.8'], kesz: true },
  { szam: 14, cim: 'Adómegtakarítás és optimális tőkeszerkezet', kepletek: ['8.4', '8.6', '8.10'], kesz: true },
]

/** A lecke ZH-ja a képleteiből. */
export function leckeKor(l: LeckeInfo): Kor {
  return kepletKor(l.kepletek[0])
}
