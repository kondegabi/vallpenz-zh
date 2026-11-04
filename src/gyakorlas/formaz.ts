// Számok a feladatszövegben és a levezetésben: tizedesvessző, felesleges nullák nélkül.

import { formatPenz, formatSzam, formatSzazalek, kerekit } from '../lib/szam.ts'
import type { Egyseg } from './tipusok.ts'

const MINUSZ = '−'
const NBSP = ' '

/** Szám legfeljebb `tizedes` jeggyel, a felesleges nullák nélkül: 0.0300 → "0,03". */
export function sz(x: number, tizedes = 4): string {
  const k = kerekit(x, tizedes)
  // csak a tizedesjegyek végéről vágjuk le a nullákat (a „10”-ből nem lehet „1”)
  const s = Math.abs(k).toFixed(tizedes).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '').replace('.', ',')
  const [egesz, tort] = s.split(',')
  const tagolt = egesz.length > 4 ? egesz.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) : egesz
  return (k < 0 ? MINUSZ : '') + (tort ? `${tagolt},${tort}` : tagolt)
}

/** Tizedes tört százalékként, felesleges nullák nélkül: 0.03 → "3%", 0.105 → "10,5%". */
export function pct(x: number, tizedes = 2): string {
  return `${sz(x * 100, tizedes)}%`
}

/** A helyes válasz kiírása a lépés mértékegységében. */
export function eredmeny(x: number, egyseg: Egyseg): string {
  switch (egyseg) {
    case '%':
      return formatSzazalek(x, 2)
    case 'tizedes':
      return formatSzam(x, 4)
    case 'USD':
      return `${formatPenz(x, 2)} USD`
    case 'M USD':
      return `${sz(x, 4)} M USD`
  }
}
