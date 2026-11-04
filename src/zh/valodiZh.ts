// Valódi ZH-minták beolvasása a forras/zh-minta/ mappából. A formátum leírása a mappa README.md-jében;
// másolható sablon: forras/zh-minta/_sablon.md. A README és a _ kezdetű fájlok nem minták.
//
// Egyelőre csak a beolvasó van kész; a „valódi ZH” mód és az összevető oldal erre épül majd.

export type MintaIgazHamis = { szoveg: string; igaz: boolean; fejezet?: string }
export type MintaValasztos = { kerdes: string; opciok: string[]; helyes: number; fejezet?: string; tipus?: string }
export type MintaSzamitas = { szoveg: string; fejezet?: string; megoldasok: { cimke?: string; ertek: string }[] }

export type ZhMinta = {
  fajl?: string
  cim: string
  forras?: string
  /** kitalált, csak a formátumot mutató példa (a címben vagy a forrásban „MINTA” áll) */
  minta: boolean
  igazHamis: MintaIgazHamis[]
  valasztos: MintaValasztos[]
  szamitas: MintaSzamitas[]
  /** a beolvasás során talált hibák, emberi nyelven (üres, ha minden rendben) */
  hibak: string[]
}

type Resz = 'Igaz-hamis' | 'Feleletválasztós' | 'Számítási'
const RESZEK: Resz[] = ['Igaz-hamis', 'Feleletválasztós', 'Számítási']

/** A sor végi {fejezet: 7.4, tipus: számítási} címkék kiemelése. */
function cimkek(sor: string): { szoveg: string; cimke: Record<string, string> } {
  const m = /\s*\{([^}]*)\}\s*$/.exec(sor)
  if (!m) return { szoveg: sor.trim(), cimke: {} }
  const cimke: Record<string, string> = {}
  for (const resz of m[1].split(',')) {
    const [k, ...v] = resz.split(':')
    if (k.trim() && v.length) cimke[k.trim()] = v.join(':').trim()
  }
  return { szoveg: sor.slice(0, m.index).trim(), cimke }
}

export function zhMintaBeolvas(md: string, fajl?: string): ZhMinta {
  const ki: ZhMinta = { fajl, cim: fajl ?? 'Névtelen ZH', minta: false, igazHamis: [], valasztos: [], szamitas: [], hibak: [] }
  let sorok = md.replace(/\r\n/g, '\n').split('\n')

  // fejléc: --- cim: … / forras: … ---
  if (sorok[0]?.trim() === '---') {
    const vege = sorok.indexOf('---', 1)
    for (const s of sorok.slice(1, vege)) {
      const [k, ...v] = s.split(':')
      if (k.trim() === 'cim') ki.cim = v.join(':').trim()
      if (k.trim() === 'forras') ki.forras = v.join(':').trim()
    }
    sorok = sorok.slice(vege + 1)
  }
  ki.minta = /MINTA/.test(`${ki.cim} ${ki.forras ?? ''}`)

  let resz: Resz | undefined
  // a számozott tételek és a hozzájuk tartozó behúzott sorok
  const tetelek: { resz: Resz; sor: string; alsorok: string[]; sorszam: number }[] = []
  for (const s of sorok) {
    const fej = /^##\s+(.+?)\s*$/.exec(s)
    if (fej) {
      resz = RESZEK.find((r) => r.toLowerCase() === fej[1].toLowerCase())
      if (!resz) ki.hibak.push(`Ismeretlen rész: „${fej[1]}” (lehet: ${RESZEK.join(', ')})`)
      continue
    }
    const tetel = /^(\d+)\.\s+(.*)$/.exec(s)
    if (tetel && resz) {
      tetelek.push({ resz, sor: tetel[2], alsorok: [], sorszam: tetelek.filter((t) => t.resz === resz).length + 1 })
      continue
    }
    if (/^\s+-\s+/.test(s) && tetelek.length) tetelek[tetelek.length - 1].alsorok.push(s.replace(/^\s+-\s+/, ''))
  }

  for (const t of tetelek) {
    const hol = `${t.resz} ${t.sorszam}.`
    if (t.resz === 'Igaz-hamis') {
      const m = /^\[(I|H)\]\s+(.*)$/.exec(t.sor)
      if (!m) {
        ki.hibak.push(`${hol}: a sor elején [I] (igaz) vagy [H] (hamis) jelölés kell`)
        continue
      }
      const { szoveg, cimke } = cimkek(m[2])
      ki.igazHamis.push({ szoveg, igaz: m[1] === 'I', ...(cimke.fejezet ? { fejezet: cimke.fejezet } : {}) })
    } else if (t.resz === 'Feleletválasztós') {
      const { szoveg, cimke } = cimkek(t.sor)
      const opciok = t.alsorok.map((o) => /^\[( |x|X)\]\s+(.*)$/.exec(o))
      const helyes = opciok.findIndex((o) => o && o[1].toLowerCase() === 'x')
      if (opciok.length < 2 || opciok.some((o) => !o) || helyes < 0 || opciok.filter((o) => o && o[1].toLowerCase() === 'x').length !== 1) {
        ki.hibak.push(`${hol}: legalább két „- [ ] …” opció kell, és pontosan egy jó („- [x] …”)`)
        continue
      }
      ki.valasztos.push({
        kerdes: szoveg,
        opciok: opciok.map((o) => o![2].trim()),
        helyes,
        ...(cimke.fejezet ? { fejezet: cimke.fejezet } : {}),
        ...(cimke.tipus ? { tipus: cimke.tipus } : {}),
      })
    } else {
      const { szoveg, cimke } = cimkek(t.sor)
      const megoldasok = t.alsorok.map((m) => {
        const [c, ...v] = m.split('=')
        return v.length ? { cimke: c.trim(), ertek: v.join('=').trim() } : { ertek: m.trim() }
      })
      if (!megoldasok.length) {
        ki.hibak.push(`${hol}: legalább egy megoldás kell („- WACC = 12,54%”)`)
        continue
      }
      ki.szamitas.push({ szoveg, ...(cimke.fejezet ? { fejezet: cimke.fejezet } : {}), megoldasok })
    }
  }
  return ki
}

// a mappa mintái (a README és a _ kezdetű fájlok nem)
const FAJLOK = import.meta.glob('/forras/zh-minta/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export const VALODI_ZH_MINTAK: ZhMinta[] = Object.entries(FAJLOK)
  .filter(([ut]) => !/\/(_[^/]*|README\.md)$/i.test(ut))
  .map(([ut, md]) => zhMintaBeolvas(md, ut.replace(/^.*\//, '')))
