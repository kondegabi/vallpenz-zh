// Kiemelés a KaTeX-képletben: a forrás nem változik, csak a megjelenítéskor csomagoljuk
// \htmlClass{...}{...}-be a jelhez tartozó részleteket.

const ELOTTE_TILOS = /[A-Za-z0-9_^\\]/
const UTANA_TILOS = /[A-Za-z0-9_{]/

/** A minta önálló előfordulásai (nem egy hosszabb jel része, pl. az r_E-ben lévő E). */
export function elofordulasok(latex: string, minta: string): number[] {
  const talalat: number[] = []
  let i = latex.indexOf(minta)
  while (i >= 0) {
    const elotte = i > 0 ? latex[i - 1] : ''
    const utana = latex[i + minta.length] ?? ''
    const mintaBetuvelVegzodik = /[A-Za-z0-9]$/.test(minta)
    const jo =
      (minta.startsWith('\\') || !elotte || !ELOTTE_TILOS.test(elotte)) &&
      (!mintaBetuvelVegzodik || !utana || !UTANA_TILOS.test(utana))
    if (jo) talalat.push(i)
    i = latex.indexOf(minta, i + 1)
  }
  return talalat
}

export function kiemel(latex: string, mintak: string[], osztaly = 'jel-kiemelt'): string {
  const savok: [number, number][] = []
  for (const m of [...mintak].sort((a, b) => b.length - a.length)) {
    for (const i of elofordulasok(latex, m)) {
      const vege = i + m.length
      if (!savok.some(([a, b]) => i < b && vege > a)) savok.push([i, vege])
    }
  }
  savok.sort((a, b) => a[0] - b[0])
  let ki = ''
  let poz = 0
  for (const [a, b] of savok) {
    ki += latex.slice(poz, a) + `\\htmlClass{${osztaly}}{${latex.slice(a, b)}}`
    poz = b
  }
  return ki + latex.slice(poz)
}
