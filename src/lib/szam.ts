// Magyar számformátum: tizedesvessző, ezres tagolás nem törő szóközzel, valódi mínuszjel.

const MINUSZ = '−'
const NBSP = ' '

export function kerekit(x: number, tizedes = 4): number {
  const m = Math.pow(10, tizedes)
  return Math.round((x + Number.EPSILON * Math.sign(x)) * m) / m
}

function tagol(egesz: string): string {
  return egesz.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
}

/** Szám magyar alakban, pl. 12627.4144 → "12 627,41". */
export function formatSzam(x: number, tizedes = 4, ezresTagolas = false): string {
  const k = kerekit(x, tizedes)
  const negativ = k < 0
  const [egesz, tort] = Math.abs(k).toFixed(tizedes).split('.')
  const e = ezresTagolas ? tagol(egesz) : egesz
  return (negativ ? MINUSZ : '') + (tort ? `${e},${tort}` : e)
}

/** Tizedes tört százalékként, pl. 0.1318 → "13,18%". */
export function formatSzazalek(x: number, tizedes = 2): string {
  return `${formatSzam(x * 100, tizedes)}%`
}

/** Pénzösszeg, pl. 12627.4144 → "12 627,41". */
export function formatPenz(x: number, tizedes = 2): string {
  return formatSzam(x, tizedes, true)
}

export type Beolvasott = { ertek: number; szazalek: boolean; tizedesjegyek: number }

/**
 * Beírt szám beolvasása. Elfogad tizedesvesszőt és -pontot, szóközös ezres tagolást,
 * „−” és „-” mínuszjelet, a végén opcionális %-ot. Érvénytelen bevitelnél null.
 * A % nincs visszaosztva: azt a hívó dönti el a lépés mértékegysége alapján.
 */
export function beolvas(s: string): Beolvasott | null {
  let t = s.trim().replace(/[\s  ]/g, '').replace(MINUSZ, '-')
  const szazalek = t.endsWith('%')
  if (szazalek) t = t.slice(0, -1)
  t = t.replace(',', '.')
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return null
  const tizedesjegyek = t.includes('.') ? t.split('.')[1].length : 0
  return { ertek: Number(t), szazalek, tizedesjegyek }
}
